import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Send, Table2, BarChart3, FileText, Sparkles, FileDown, Sheet } from "lucide-react";
import { motion } from "motion/react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, GridReadyEvent, PaginationChangedEvent, RowClickedEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { LoadingAnimation } from "../components/LoadingAnimation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

type Message = {
  role: 'user' | 'ai';
  content: string;
  actions?: Array<{ label: string; onClick: () => void }>;
};

type ChartRow = {
  category: string;
  value: number;
  std?: number;
  raw_mean?: number;
};

type ChartMeta = {
  mode?: string;
  primary_chart?: "bar" | "line";
  secondary_chart?: "bar" | "line";
  title?: string;
  secondary_title?: string;
  description?: string;
  value_key?: "value" | "raw_mean";
  /** 보조 차트의 dataKey (기본값 "value") */
  secondary_value_key?: "value" | "raw_mean";
};

type TableRow = {
  name: string;
  dtype: string;
  missing: number;
  unique?: number;
  mean?: number;
};

type GridRow = Record<string, string | number | boolean | null>;

type AnalyzeResponse = {
  status: string;
  recommended_method: string;
  explanation: string;
  insights: string[];
  chart_data: ChartRow[];
  secondary_chart_data?: ChartRow[];
  chart_meta?: ChartMeta;
  table_data: TableRow[];
  evidence?: Record<string, unknown>;
  method_options?: Array<{
    method: string;
    when_to_use: string;
    current_fit: string;
  }>;
  next_question?: string;
  summary?: {
    row_count: number;
    column_count: number;
    missing_total: number;
  };
  report_id?: number;
  session_id?: string;
  grid_columns?: string[];
  grid_rows?: GridRow[];
  grid_row_count?: number;
  grid_truncated?: boolean;
  original_grid_columns?: string[];
  original_grid_rows?: GridRow[];
  original_grid_row_count?: number;
  original_grid_truncated?: boolean;
  edited_grid_columns?: string[];
  edited_grid_rows?: GridRow[];
  edited_grid_row_count?: number;
  edited_grid_truncated?: boolean;
  applied_code?: string;
  is_modified?: boolean;
  reset_done?: boolean;
};

type QuickEditResponse = {
  status: string;
  session_id?: string;
  is_modified?: boolean;
  applied_code?: string;
  applied_command?: string;
  summary?: {
    row_count: number;
    column_count: number;
    missing_total: number;
  };
  grid_columns?: string[];
  grid_rows?: GridRow[];
  grid_row_count?: number;
  grid_truncated?: boolean;
  original_grid_columns?: string[];
  original_grid_rows?: GridRow[];
  original_grid_row_count?: number;
  original_grid_truncated?: boolean;
  edited_grid_columns?: string[];
  edited_grid_rows?: GridRow[];
  edited_grid_row_count?: number;
  edited_grid_truncated?: boolean;
};

type PdfFontStatusResponse = {
  status: string;
  font_name?: string;
  full_unicode?: boolean;
  env_font_path?: string | null;
  env_font_exists?: boolean;
  using_fallback_helvetica?: boolean;
};

const API_BASE_URL = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || "http://127.0.0.1:8016";
const LAST_REPORT_ID_KEY = "datalens_last_report_id";
const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

export function AnalysisLab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: '안녕하세요! 데이터 분석을 도와드리겠습니다. 먼저 분석하실 엑셀 또는 CSV 파일을 업로드해주세요.',
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'chart' | 'insight'>('table');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [secondaryChartData, setSecondaryChartData] = useState<ChartRow[]>([]);
  const [chartMeta, setChartMeta] = useState<ChartMeta | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [summary, setSummary] = useState<AnalyzeResponse['summary']>();
  const [recommendedMethod, setRecommendedMethod] = useState("-");
  const [explanation, setExplanation] = useState("");
  const [methodOptions, setMethodOptions] = useState<NonNullable<AnalyzeResponse['method_options']>>([]);
  const [nextQuestion, setNextQuestion] = useState("");
  const [currentReportId, setCurrentReportId] = useState<number | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSessionModified, setIsSessionModified] = useState(false);
  const [originalGridColumns, setOriginalGridColumns] = useState<string[]>([]);
  const [originalGridRows, setOriginalGridRows] = useState<GridRow[]>([]);
  const [originalGridRowCount, setOriginalGridRowCount] = useState(0);
  const [originalGridTruncated, setOriginalGridTruncated] = useState(false);
  const [editedGridColumns, setEditedGridColumns] = useState<string[]>([]);
  const [editedGridRows, setEditedGridRows] = useState<GridRow[]>([]);
  const [editedGridRowCount, setEditedGridRowCount] = useState(0);
  const [editedGridTruncated, setEditedGridTruncated] = useState(false);
  const [gridColumns, setGridColumns] = useState<string[]>([]);
  const [gridRows, setGridRows] = useState<GridRow[]>([]);
  const [gridRowCount, setGridRowCount] = useState(0);
  const [gridTruncated, setGridTruncated] = useState(false);
  const [lastAppliedCode, setLastAppliedCode] = useState("");
  const [tableView, setTableView] = useState<'schema' | 'rows'>('schema');
  const [rowDatasetView, setRowDatasetView] = useState<'original' | 'edited'>('original');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRowGlobalIndex, setSelectedRowGlobalIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);
  const [isBackgroundRefreshingInsight, setIsBackgroundRefreshingInsight] = useState(false);
  const [changedCellKeys, setChangedCellKeys] = useState<Set<string>>(new Set());
  const [changedCellCount, setChangedCellCount] = useState(0);
  const [changedRowCount, setChangedRowCount] = useState(0);
  const [evidence, setEvidence] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowGridTopRef = useRef<HTMLDivElement>(null);
  const gridApiRef = useRef<GridApi<GridRow> | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const backgroundAnalyzeTimerRef = useRef<number | null>(null);
  const progressStartRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      if (backgroundAnalyzeTimerRef.current) {
        window.clearTimeout(backgroundAnalyzeTimerRef.current);
      }
    };
  }, []);

  const computeChangedCellState = (
    prevRows: GridRow[],
    nextRows: GridRow[],
    columns: string[],
  ): { keys: Set<string>; changedCells: number; changedRows: number } => {
    const keys = new Set<string>();
    const safeValue = (v: unknown) => (v === null || typeof v === "undefined" ? "" : String(v));

    const compareLen = Math.min(prevRows.length, nextRows.length);
    let changedRowsLocal = 0;

    for (let rowIndex = 0; rowIndex < compareLen; rowIndex += 1) {
      let rowChanged = false;
      for (const col of columns) {
        const beforeVal = safeValue(prevRows[rowIndex]?.[col]);
        const afterVal = safeValue(nextRows[rowIndex]?.[col]);
        if (beforeVal !== afterVal) {
          keys.add(`${rowIndex}:${col}`);
          rowChanged = true;
        }
      }
      if (rowChanged) {
        changedRowsLocal += 1;
      }
    }

    const rowDelta = Math.abs(nextRows.length - prevRows.length);
    changedRowsLocal += rowDelta;

    return {
      keys,
      changedCells: keys.size,
      changedRows: changedRowsLocal,
    };
  };

  const startProgress = () => {
    progressStartRef.current = Date.now();
    setProgress(1);
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
    }
    progressTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - progressStartRef.current;
      let target = 5;

      if (elapsed < 8000) {
        target = 5 + (elapsed / 8000) * 85; // 5 -> 90
      } else if (elapsed < 18000) {
        target = 90 + ((elapsed - 8000) / 10000) * 8; // 90 -> 98
      } else {
        target = 98 + Math.min((elapsed - 18000) / 5000, 1); // 98 -> 99
      }

      setProgress((prev) => Math.max(prev, Math.min(target, 99)));
    }, 250);
  };

  const finishProgress = async () => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(100);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
  };

  const applyAnalyzeResponse = (data: AnalyzeResponse) => {
    setChartData(data.chart_data || []);
    const fallbackMeta = ((data.evidence || {}) as { visualization?: ChartMeta }).visualization;
    const fallbackSecondary = ((data.evidence || {}) as { secondary_chart_data?: ChartRow[] }).secondary_chart_data;
    setChartMeta(data.chart_meta || fallbackMeta || null);
    setSecondaryChartData(data.secondary_chart_data || fallbackSecondary || []);
    setTableData(data.table_data || []);
    setInsights(data.insights || []);
    setSummary(data.summary);
    setEvidence(data.evidence || null);
    setRecommendedMethod(data.recommended_method || "-");
    setExplanation(data.explanation || "");
    setMethodOptions(data.method_options || []);
    setNextQuestion(data.next_question || "");
    setCurrentReportId(data.report_id ?? null);
    setCurrentSessionId(data.session_id ?? null);
    const modified = Boolean(data.is_modified);
    setIsSessionModified(modified);
    setRowDatasetView(modified ? 'edited' : 'original');

    const originalCols = data.original_grid_columns || data.grid_columns || [];
    const originalRows = data.original_grid_rows || data.grid_rows || [];
    const originalCount = data.original_grid_row_count ?? data.grid_row_count ?? 0;
    const originalTruncated = Boolean(data.original_grid_truncated ?? data.grid_truncated ?? false);

    const editedCols = data.edited_grid_columns || data.grid_columns || [];
    const editedRows = data.edited_grid_rows || data.grid_rows || [];
    const editedCount = data.edited_grid_row_count ?? data.grid_row_count ?? 0;
    const editedTruncated = Boolean(data.edited_grid_truncated ?? data.grid_truncated ?? false);

    setOriginalGridColumns(originalCols);
    setOriginalGridRows(originalRows);
    setOriginalGridRowCount(originalCount);
    setOriginalGridTruncated(originalTruncated);
    setEditedGridColumns(editedCols);
    setEditedGridRows(editedRows);
    setEditedGridRowCount(editedCount);
    setEditedGridTruncated(editedTruncated);

    // 하위 호환 상태는 수정 데이터 기준으로 유지
    setGridColumns(editedCols);
    setGridRows(editedRows);
    setGridRowCount(editedCount);
    setGridTruncated(editedTruncated);
    setLastAppliedCode(data.applied_code || "");
    setCurrentPage(1);
    setTotalPages(1);
    setSelectedRowGlobalIndex(null);

    if (typeof data.report_id === "number") {
      window.localStorage.setItem(LAST_REPORT_ID_KEY, String(data.report_id));
    }
  };

  const applyQuickEditResponse = (data: QuickEditResponse) => {
    const prevEditedRows = editedGridRows;
    const prevEditedColumns = editedGridColumns;

    const originalCols = data.original_grid_columns || originalGridColumns;
    const originalRows = data.original_grid_rows || originalGridRows;
    const originalCount = data.original_grid_row_count ?? originalGridRowCount;
    const originalTruncated = Boolean(data.original_grid_truncated ?? originalGridTruncated ?? false);

    const editedCols = data.edited_grid_columns || data.grid_columns || editedGridColumns;
    const editedRows = data.edited_grid_rows || data.grid_rows || editedGridRows;
    const editedCount = data.edited_grid_row_count ?? data.grid_row_count ?? editedGridRowCount;
    const editedTruncated = Boolean(data.edited_grid_truncated ?? data.grid_truncated ?? editedGridTruncated ?? false);

    if (data.session_id) {
      setCurrentSessionId(data.session_id);
    }
    setIsSessionModified(Boolean(data.is_modified ?? true));
    setRowDatasetView('edited');

    setOriginalGridColumns(originalCols);
    setOriginalGridRows(originalRows);
    setOriginalGridRowCount(originalCount);
    setOriginalGridTruncated(originalTruncated);

    setEditedGridColumns(editedCols);
    setEditedGridRows(editedRows);
    setEditedGridRowCount(editedCount);
    setEditedGridTruncated(editedTruncated);

    setGridColumns(editedCols);
    setGridRows(editedRows);
    setGridRowCount(editedCount);
    setGridTruncated(editedTruncated);
    setLastAppliedCode(data.applied_code || "");

    const diff = computeChangedCellState(
      prevEditedRows,
      editedRows,
      editedCols.length > 0 ? editedCols : prevEditedColumns,
    );
    setChangedCellKeys(diff.keys);
    setChangedCellCount(diff.changedCells);
    setChangedRowCount(diff.changedRows);

    if (data.summary) {
      setSummary(data.summary);
    }

    setTableView('rows');
    setCurrentPage(1);
    setTotalPages(1);
    setSelectedRowGlobalIndex(null);
  };

  const runSessionAnalyzeInBackground = async (sessionId: string, questionText: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/session/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          question: questionText || "수정 후 인사이트를 갱신해줘",
        }),
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as AnalyzeResponse;
      applyAnalyzeResponse(data);
    } finally {
      setIsBackgroundRefreshingInsight(false);
    }
  };

  const scheduleBackgroundInsightRefresh = (sessionId: string, commandText: string) => {
    if (backgroundAnalyzeTimerRef.current) {
      window.clearTimeout(backgroundAnalyzeTimerRef.current);
      backgroundAnalyzeTimerRef.current = null;
    }

    setIsBackgroundRefreshingInsight(true);
    backgroundAnalyzeTimerRef.current = window.setTimeout(() => {
      void runSessionAnalyzeInBackground(
        sessionId,
        `사용자 명령 '${commandText}' 적용 후 인사이트를 최신 상태로 업데이트해줘`,
      );
    }, 1200);
  };

  const inferBaseName = () => {
    const raw = selectedFile?.name || "analysis_report";
    const idx = raw.lastIndexOf(".");
    return idx > 0 ? raw.slice(0, idx) : raw;
  };

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!currentReportId) {
      setMessages((prev) => [...prev, { role: 'ai', content: '다운로드할 리포트가 없습니다. 먼저 분석을 실행해 주세요.' }]);
      return;
    }

    setIsDownloadingPdf(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${currentReportId}/export/pdf`);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "PDF 다운로드 실패");
      }
      const blob = await response.blob();
      const filename = `${inferBaseName()}_report_${currentReportId}.pdf`;
      triggerBlobDownload(blob, filename);

      try {
        const statusResponse = await fetch(`${API_BASE_URL}/debug/pdf-font-status`);
        if (statusResponse.ok) {
          const status = (await statusResponse.json()) as PdfFontStatusResponse;
          const fontLabel = status.font_name || "Unknown";
          const unicodeLabel = status.full_unicode ? "유니코드 가능" : "유니코드 불가";
          const envLabel = status.env_font_path
            ? `${status.env_font_path} (${status.env_font_exists ? "존재" : "없음"})`
            : "미설정";
          const fallbackHint = status.using_fallback_helvetica
            ? "\n경고: 현재 Helvetica 폴백 사용 중이라 한글 깨짐 가능성이 높습니다."
            : "";

          setMessages((prev) => [
            ...prev,
            {
              role: 'ai',
              content: `PDF 다운로드 완료.\n서버 폰트 상태: ${fontLabel} (${unicodeLabel})\nDATALENS_PDF_FONT_PATH: ${envLabel}${fallbackHint}`,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'ai',
              content: 'PDF 다운로드는 완료되었습니다. 다만 서버 폰트 상태 확인 API 호출에는 실패했습니다.',
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            content: 'PDF 다운로드는 완료되었습니다. 네트워크 문제로 서버 폰트 상태 확인에 실패했습니다.',
          },
        ]);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "알 수 없는 오류";
      setMessages((prev) => [...prev, { role: 'ai', content: `PDF 다운로드 중 오류가 발생했습니다.\n${detail}` }]);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadEditedExcel = async () => {
    if (!currentSessionId) {
      setMessages((prev) => [...prev, { role: 'ai', content: '수정된 데이터 세션이 없습니다. 먼저 파일 업로드 후 수정 명령을 실행해 주세요.' }]);
      return;
    }

    setIsDownloadingExcel(true);
    try {
      const response = await fetch(`${API_BASE_URL}/session/${currentSessionId}/export/excel`);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "수정된 엑셀 다운로드 실패");
      }
      const blob = await response.blob();
      const filename = `${inferBaseName()}_edited.xlsx`;
      triggerBlobDownload(blob, filename);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "알 수 없는 오류";
      setMessages((prev) => [...prev, { role: 'ai', content: `수정된 엑셀 다운로드 중 오류가 발생했습니다.\n${detail}` }]);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handleResetModifiedData = async () => {
    if (!currentSessionId) {
      setMessages((prev) => [...prev, { role: 'ai', content: '복원할 세션이 없습니다. 먼저 파일을 업로드해 주세요.' }]);
      return;
    }

    setIsResettingData(true);
    setIsLoading(true);
    startProgress();
    try {
      const response = await fetch(`${API_BASE_URL}/session/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: currentSessionId,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "원본 데이터 복원 실패");
      }

      const data = (await response.json()) as AnalyzeResponse;
      applyAnalyzeResponse(data);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: '수정 데이터를 지우고 원본 데이터 상태로 복원했습니다. 분석 결과도 원본 기준으로 다시 계산되었습니다.',
        },
      ]);
      setActiveTab('table');
    } catch (error) {
      const detail = error instanceof Error ? error.message : "알 수 없는 오류";
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `원본 복원 중 오류가 발생했습니다.\n${detail}`,
        },
      ]);
    } finally {
      await finishProgress();
      setIsLoading(false);
      setIsResettingData(false);
    }
  };

  const runAnalyze = async (file: File, questionText: string) => {
    setChangedCellKeys(new Set());
    setChangedCellCount(0);
    setChangedRowCount(0);
    setIsLoading(true);
    startProgress();
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("question", questionText || "데이터 핵심 인사이트를 설명해줘");

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "분석 요청 실패");
      }

      const data = (await response.json()) as AnalyzeResponse;
      applyAnalyzeResponse(data);

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content:
            `분석이 완료되었습니다. 추천 기법: ${data.recommended_method}\n\n${data.explanation}`,
        },
      ]);
      setActiveTab('insight');
    } catch (error) {
      const detail = error instanceof Error ? error.message : "알 수 없는 오류";
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `분석 중 오류가 발생했습니다.\n${detail}`,
        },
      ]);
    } finally {
      await finishProgress();
      setIsLoading(false);
    }
  };

  const runSessionAnalyze = async (sessionId: string, questionText: string) => {
    setChangedCellKeys(new Set());
    setChangedCellCount(0);
    setChangedRowCount(0);
    setIsLoading(true);
    startProgress();
    try {
      const response = await fetch(`${API_BASE_URL}/session/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          question: questionText || "데이터 핵심 인사이트를 설명해줘",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "세션 분석 요청 실패");
      }

      const data = (await response.json()) as AnalyzeResponse;
      applyAnalyzeResponse(data);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `요청하신 질문 기준으로 재분석을 완료했습니다.\n추천 기법: ${data.recommended_method}\n\n${data.explanation}`,
        },
      ]);
      setActiveTab('insight');
    } catch (error) {
      const detail = error instanceof Error ? error.message : "알 수 없는 오류";
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `세션 재분석 중 오류가 발생했습니다.\n${detail}`,
        },
      ]);
    } finally {
      await finishProgress();
      setIsLoading(false);
    }
  };

  const runSessionEdit = async (sessionId: string, commandText: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/session/edit/quick`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          command: commandText,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "데이터 수정 요청 실패");
      }

      const data = (await response.json()) as QuickEditResponse;
      applyQuickEditResponse(data);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: [
            `요청하신 수정이 즉시 반영되었습니다.`,
            data.applied_code ? `적용 코드: ${data.applied_code}` : null,
            `표에서 바로 수정 결과를 확인해 주세요.`,
          ].filter(Boolean).join("\n"),
        },
      ]);
      setActiveTab('table');
      scheduleBackgroundInsightRefresh(sessionId, commandText);
    } catch (error) {
      setIsBackgroundRefreshingInsight(false);
      const detail = error instanceof Error ? error.message : "알 수 없는 오류";
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `데이터 수정 중 오류가 발생했습니다.\n${detail}`,
        },
      ]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setFileUploaded(true);
    setMessages((prev) => [
      ...prev,
      { role: 'ai', content: `파일 업로드 완료: ${file.name}\n기본 분석을 시작합니다.` },
    ]);
    await runAnalyze(file, input);
  };

  const handleAnalysisAction = async (type: string) => {
    if (!selectedFile) {
      setMessages((prev) => [...prev, { role: 'ai', content: '먼저 파일을 업로드해 주세요.' }]);
      return;
    }
    const query = `${type} 중심으로 분석해줘`;
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    if (currentSessionId) {
      await runSessionAnalyze(currentSessionId, query);
      return;
    }
    await runAnalyze(selectedFile, query);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const question = input;
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setInput("");

    if (!selectedFile) {
      setMessages((prev) => [...prev, { role: 'ai', content: '파일 업로드 후 질문해 주세요.' }]);
      return;
    }

    if (!currentSessionId) {
      await runAnalyze(selectedFile, question);
      return;
    }

    const editIntentRegex = /(제외|삭제|빼고|제거|필터|남겨|바꿔|변경|수정|채워|대체|0으로|무작위|랜덤|집어|넣어|입력|보정|소수점|반올림|자리|더해|더해줘|증가|올려|빼줘|감소|낮춰|곱해|곱해줘|곱하기|나눠|나눠줘|나누기)/;
    if (editIntentRegex.test(question)) {
      await runSessionEdit(currentSessionId, question);
      return;
    }

    await runSessionAnalyze(currentSessionId, question);
  };

  const evidenceCount = Object.values(evidence || {}).filter((v) => v).length;
  const analysisTechniqueCount = evidenceCount > 0 ? evidenceCount : (recommendedMethod !== "-" ? 1 : 0);
  const today = new Date().toLocaleDateString("ko-KR");
  const rawMeanData = useMemo(
    () => chartData.filter((d) => typeof d.raw_mean === "number").map((d) => ({ category: d.category, value: d.raw_mean as number })),
    [chartData]
  );
  const groupMetric = useMemo(() => {
    const gm = (evidence || {}).group_metric as { group_col?: string; value_col?: string; n_groups?: number } | undefined;
    if (!gm || !gm.group_col || !gm.value_col) return null;
    return gm;
  }, [evidence]);
  const isGroupedMetricChart = useMemo(
    () => Boolean(groupMetric && rawMeanData.length > 0 && rawMeanData.length === chartData.length),
    [groupMetric, rawMeanData, chartData]
  );
  const primaryDataKey = chartMeta?.value_key || (isGroupedMetricChart ? "raw_mean" : "value");
  const secondaryDataKey: "value" | "raw_mean" =
    chartMeta?.secondary_value_key === "raw_mean" ? "raw_mean" : "value";
  const secondarySeriesName =
    chartMeta?.mode === "group_compare" ? "표본 수" : chartMeta?.mode === "categorical_association" ? "비율(%)" : "값";
  const primaryChartType = chartMeta?.primary_chart || "bar";
  const secondaryChartType = chartMeta?.secondary_chart || "line";
  const secondaryPlotData = useMemo(
    () => (secondaryChartData.length > 0 ? secondaryChartData : (isGroupedMetricChart ? rawMeanData : chartData)),
    [secondaryChartData, isGroupedMetricChart, rawMeanData, chartData]
  );
  const primaryLegend = isGroupedMetricChart
    ? `${groupMetric?.value_col || "지표"} 평균`
    : chartMeta?.mode === "regression_importance"
      ? "영향도(%)"
      : "표준화 값(0-100)";
  const missingByColumn = useMemo(
    () => tableData.filter((r) => r.missing > 0).sort((a, b) => b.missing - a.missing).slice(0, 12).map((r) => ({ name: r.name, missing: r.missing })),
    [tableData]
  );
  const dtypeDistribution = useMemo(() => {
    const counter = new Map<string, number>();
    for (const row of tableData) {
      const key = row.dtype.includes("int") || row.dtype.includes("float")
        ? "수치형"
        : row.dtype.includes("datetime")
          ? "날짜형"
          : "범주형/문자형";
      counter.set(key, (counter.get(key) || 0) + 1);
    }
    return Array.from(counter.entries()).map(([name, value]) => ({ name, value }));
  }, [tableData]);
  const completeness = useMemo(() => {
    if (!summary) return 0;
    const total = Math.max(summary.row_count * summary.column_count, 1);
    return Number(((1 - summary.missing_total / total) * 100).toFixed(1));
  }, [summary]);
  const PIE_COLORS = ["#14B8A6", "#6366F1", "#F59E0B", "#EC4899", "#10B981"];

  const activeGrid = useMemo(() => {
    const showEdited = isSessionModified && rowDatasetView === 'edited';
    return {
      label: showEdited ? '수정된 행 데이터' : '원본 행 데이터',
      columns: showEdited ? editedGridColumns : originalGridColumns,
      rows: showEdited ? editedGridRows : originalGridRows,
      rowCount: showEdited ? editedGridRowCount : originalGridRowCount,
      truncated: showEdited ? editedGridTruncated : originalGridTruncated,
      emptyMessage: showEdited
        ? '수정된 행 데이터가 없습니다. 먼저 수정 명령을 실행해 주세요.'
        : '표시할 원본 행 데이터가 없습니다. 파일 업로드 후 분석을 실행해 주세요.',
    };
  }, [
    isSessionModified,
    rowDatasetView,
    editedGridColumns,
    editedGridRows,
    editedGridRowCount,
    editedGridTruncated,
    originalGridColumns,
    originalGridRows,
    originalGridRowCount,
    originalGridTruncated,
  ]);

  const gridDefaultColDef = useMemo<ColDef<GridRow>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 140,
      flex: 1,
    }),
    []
  );

  const gridColumnDefs = useMemo<ColDef<GridRow>[]>(() => {
    const rowIndexCol: ColDef<GridRow> = {
      headerName: '#',
      colId: '__row_index__',
      pinned: 'left',
      width: 86,
      maxWidth: 100,
      minWidth: 72,
      sortable: false,
      filter: false,
      resizable: false,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
      cellClass: 'text-muted-foreground',
      suppressMovable: true,
    };

    const dataCols = activeGrid.columns.map((col): ColDef<GridRow> => ({
      field: col,
      headerName: col,
      valueFormatter: (params) => (params.value === null || typeof params.value === 'undefined' ? '' : String(params.value)),
      cellClassRules: {
        "datalens-cell-updated": (params) => {
          if (rowDatasetView !== 'edited') return false;
          const rowIndex = params.node?.rowIndex ?? -1;
          return rowIndex >= 0 && changedCellKeys.has(`${rowIndex}:${col}`);
        },
      },
    }));

    return [rowIndexCol, ...dataCols];
  }, [activeGrid.columns, rowDatasetView, changedCellKeys]);

  const visibleStart = activeGrid.rowCount === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
  const visibleEnd = activeGrid.rowCount === 0 ? 0 : Math.min(currentPage * pageSize, activeGrid.rowCount);
  const selectedRowCoordinate = useMemo(() => {
    if (!selectedRowGlobalIndex || selectedRowGlobalIndex < 1) return null;
    const page = Math.floor((selectedRowGlobalIndex - 1) / pageSize) + 1;
    const rowInPage = ((selectedRowGlobalIndex - 1) % pageSize) + 1;
    return {
      page,
      rowInPage,
      global: selectedRowGlobalIndex,
    };
  }, [selectedRowGlobalIndex, pageSize]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [1];
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [currentPage, totalPages]);

  const syncPaginationState = (api: GridApi<GridRow>) => {
    const nextTotalPages = Math.max(api.paginationGetTotalPages(), 1);
    const nextCurrentPage = Math.min(api.paginationGetCurrentPage() + 1, nextTotalPages);
    setTotalPages(nextTotalPages);
    setCurrentPage(nextCurrentPage);
  };

  const setGridPageSize = (api: GridApi<GridRow>, nextSize: number) => {
    const legacyApi = api as GridApi<GridRow> & { paginationSetPageSize?: (size: number) => void };
    if (typeof legacyApi.paginationSetPageSize === "function") {
      legacyApi.paginationSetPageSize(nextSize);
    } else {
      api.setGridOption("paginationPageSize", nextSize);
    }
  };

  const goToPage = (targetPage: number) => {
    const api = gridApiRef.current;
    if (!api) return;

    const lastPage = Math.max(api.paginationGetTotalPages(), 1);
    const clamped = Math.min(Math.max(targetPage, 1), lastPage);
    api.paginationGoToPage(clamped - 1);
    const firstRowIndex = (clamped - 1) * pageSize;
    api.ensureIndexVisible(firstRowIndex, "top");
    syncPaginationState(api);
    rowGridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGridReady = (event: GridReadyEvent<GridRow>) => {
    gridApiRef.current = event.api;
    setGridPageSize(event.api, pageSize);
    event.api.paginationGoToFirstPage();
    syncPaginationState(event.api);
  };

  const handlePaginationChanged = (event: PaginationChangedEvent<GridRow>) => {
    if (!event.api) return;
    syncPaginationState(event.api);
  };

  const handleRowClicked = (event: RowClickedEvent<GridRow>) => {
    const rowIndex = (event.node?.rowIndex ?? -1) + 1;
    if (rowIndex > 0) {
      setSelectedRowGlobalIndex(rowIndex);
    }
  };

  const handleChangePageSize = (nextSize: (typeof PAGE_SIZE_OPTIONS)[number]) => {
    setPageSize(nextSize);
    const api = gridApiRef.current;
    if (!api) return;
    setGridPageSize(api, nextSize);
    api.paginationGoToFirstPage();
    syncPaginationState(api);
    rowGridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const api = gridApiRef.current;
    if (!api || tableView !== "rows") return;
    api.paginationGoToFirstPage();
    syncPaginationState(api);
    setSelectedRowGlobalIndex(null);
  }, [activeGrid.rows, activeGrid.columns, rowDatasetView, tableView]);

  return (
    <div className="h-screen flex">
      {/* Left Panel - Chat & Control */}
      <div className="w-[35%] border-r border-border flex flex-col bg-card">
        {/* Upload Area */}
        <div className="p-6 border-b border-border">
          <motion.div
            whileHover={{ scale: fileUploaded ? 1 : 1.02 }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              fileUploaded 
                ? 'border-accent bg-accent/5' 
                : 'border-border hover:border-accent hover:bg-accent/5'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleFileUpload(file);
                }
                e.currentTarget.value = "";
              }}
            />
            <Upload className={`mx-auto mb-3 ${fileUploaded ? 'text-accent' : 'text-muted-foreground'}`} size={32} />
            <h3 className="font-semibold text-foreground mb-1">
              {fileUploaded ? '✓ 데이터 업로드 완료' : '파일을 드래그하거나 클릭하세요'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {fileUploaded && selectedFile ? selectedFile.name : 'Excel (.xlsx) 또는 CSV 파일 지원'}
            </p>
          </motion.div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'space-y-3'}`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                      <Sparkles size={14} className="text-accent-foreground" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">AI 어시스턴트</span>
                  </div>
                )}
                
                <div className={`p-4 rounded-2xl whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {msg.content}
                </div>

                {msg.actions && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.actions.map((action, actionIdx) => (
                      <button
                        key={actionIdx}
                        onClick={action.onClick}
                        className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-secondary p-4 rounded-2xl min-w-[220px]">
                <LoadingAnimation />
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">분석 진행률 {progress.toFixed(1)}%</div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="AI에게 질문하세요..."
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Visualization */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Tabs */}
        <div className="border-b border-border bg-card">
          <div className="flex px-6">
            {[
              { id: 'table' as const, label: '데이터 테이블', icon: Table2 },
              { id: 'chart' as const, label: '시각화 차트', icon: BarChart3 },
              { id: 'insight' as const, label: '인사이트 리포트', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'table' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">데이터 테이블</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {summary
                      ? `${summary.row_count}행 / ${summary.column_count}열 / 결측 ${summary.missing_total}개`
                      : "업로드된 데이터 정보를 불러오는 중입니다."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setTableView('schema')}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      tableView === 'schema'
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-secondary text-secondary-foreground border-border'
                    }`}
                  >
                    메타정보
                  </button>
                  <button
                    onClick={() => {
                      setTableView('rows');
                      setRowDatasetView('original');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      tableView === 'rows' && rowDatasetView === 'original'
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-secondary text-secondary-foreground border-border'
                    }`}
                  >
                    원본 행 데이터
                  </button>
                  <button
                    onClick={() => {
                      setTableView('rows');
                      setRowDatasetView('edited');
                    }}
                    disabled={!isSessionModified}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      tableView === 'rows' && rowDatasetView === 'edited'
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-secondary text-secondary-foreground border-border'
                    }`}
                  >
                    수정된 행 데이터
                  </button>
                  {tableView === 'rows' && (
                    <span className="text-xs text-muted-foreground">
                      표시 행 {activeGrid.rows.length} / 전체 {activeGrid.rowCount}
                    </span>
                  )}
                </div>

                {tableView === 'rows' && lastAppliedCode && (
                  <div className="text-xs text-muted-foreground bg-secondary rounded-lg p-3 break-all">
                    마지막 적용 코드: {lastAppliedCode}
                  </div>
                )}
              </div>
              {tableView === 'schema' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">변수명</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">데이터 타입</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">결측치</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">통계량</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, idx) => (
                        <tr key={`${row.name}-${idx}`} className="border-t border-border hover:bg-secondary/50">
                          <td className="px-6 py-4 text-foreground font-medium">{row.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              row.dtype.includes('float') || row.dtype.includes('int')
                                ? 'bg-accent/10 text-accent'
                                : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                            }`}>
                              {row.dtype}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{row.missing}</td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {typeof row.mean === 'number' ? `평균: ${row.mean}` : `고유값: ${row.unique ?? 0}개`}
                          </td>
                        </tr>
                      ))}
                      {tableData.length === 0 && (
                        <tr>
                          <td className="px-6 py-8 text-muted-foreground" colSpan={4}>아직 분석 데이터가 없습니다.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4">
                  <div className={`rounded-xl border overflow-hidden bg-card ${rowDatasetView === 'edited' ? 'border-accent/40' : 'border-border'}`}>
                    <div className={`px-4 py-3 border-b border-border ${rowDatasetView === 'edited' ? 'bg-accent/5' : 'bg-secondary/50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{activeGrid.label}</h4>
                          <p className="text-xs text-muted-foreground mt-1">표시 행 {activeGrid.rows.length} / 전체 {activeGrid.rowCount}</p>
                          {rowDatasetView === 'edited' && changedCellCount > 0 && (
                            <p className="text-xs text-accent mt-1">
                              방금 수정됨: {changedRowCount}개 행, {changedCellCount}개 셀
                            </p>
                          )}
                          {isBackgroundRefreshingInsight && (
                            <p className="text-xs text-muted-foreground mt-1">인사이트를 백그라운드에서 업데이트하는 중입니다...</p>
                          )}
                        </div>
                        {isSessionModified && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => { void handleDownloadEditedExcel(); }}
                              disabled={!currentSessionId || isDownloadingExcel}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80 text-xs"
                            >
                              <Sheet size={14} />
                              {isDownloadingExcel ? "엑셀 생성 중..." : "수정된 엑셀파일 다운로드"}
                            </button>
                            <button
                              onClick={() => { void handleResetModifiedData(); }}
                              disabled={!currentSessionId || isResettingData}
                              className="px-3 py-2 rounded-lg bg-destructive text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 text-xs"
                            >
                              {isResettingData ? "복원 중..." : "데이터 지우기"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {activeGrid.rows.length > 0 ? (
                      <>
                      <div ref={rowGridTopRef} className="ag-theme-alpine datalens-grid h-[62vh] w-full">
                        <AgGridReact<GridRow>
                          theme={"legacy"}
                          rowData={activeGrid.rows}
                          columnDefs={gridColumnDefs}
                          defaultColDef={gridDefaultColDef}
                          rowModelType="clientSide"
                          pagination={true}
                          paginationPageSize={pageSize}
                          suppressPaginationPanel={true}
                          animateRows={false}
                          suppressCellFocus={true}
                          onGridReady={handleGridReady}
                          onPaginationChanged={handlePaginationChanged}
                          onRowClicked={handleRowClicked}
                        />
                      </div>
                      <div className="px-4 py-3 border-t border-border bg-secondary/40">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">페이지당 행</span>
                            <select
                              value={pageSize}
                              onChange={(e) => handleChangePageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
                              className="h-9 rounded-md border border-border bg-card px-2.5 text-sm text-foreground"
                            >
                              {PAGE_SIZE_OPTIONS.map((size) => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                            <span className="rounded-md bg-card px-2 py-1 border border-border">전체 {activeGrid.rowCount}행</span>
                            <span className="rounded-md bg-card px-2 py-1 border border-border">현재 {currentPage}/{totalPages}페이지</span>
                            <span className="rounded-md bg-card px-2 py-1 border border-border">{visibleStart}-{visibleEnd}행 표시</span>
                            {selectedRowCoordinate && (
                              <span className="rounded-md bg-accent/10 text-accent px-2 py-1 border border-accent/40">
                                선택 좌표: {selectedRowCoordinate.page}페이지 {selectedRowCoordinate.rowInPage}번째 줄 (전체 {selectedRowCoordinate.global}행)
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => goToPage(1)}
                              disabled={currentPage <= 1}
                              className="px-3 py-2 rounded-md border border-border bg-card text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary"
                            >
                              처음
                            </button>
                            <button
                              onClick={() => goToPage(currentPage - 1)}
                              disabled={currentPage <= 1}
                              className="px-3 py-2 rounded-md border border-border bg-card text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary"
                            >
                              이전
                            </button>

                            {pageNumbers.map((page) => (
                              <button
                                key={`page-${page}`}
                                onClick={() => goToPage(page)}
                                className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                                  page === currentPage
                                    ? "border-accent bg-accent text-accent-foreground"
                                    : "border-border bg-card text-foreground hover:bg-secondary"
                                }`}
                              >
                                {page}
                              </button>
                            ))}

                            <button
                              onClick={() => goToPage(currentPage + 1)}
                              disabled={currentPage >= totalPages}
                              className="px-3 py-2 rounded-md border border-border bg-card text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary"
                            >
                              다음
                            </button>
                            <button
                              onClick={() => goToPage(totalPages)}
                              disabled={currentPage >= totalPages}
                              className="px-3 py-2 rounded-md border border-border bg-card text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary"
                            >
                              끝
                            </button>
                          </div>
                        </div>
                      </div>
                      </>
                    ) : (
                      <div className="px-6 py-10 text-sm text-muted-foreground">{activeGrid.emptyMessage}</div>
                    )}

                    {activeGrid.truncated && (
                      <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-secondary">
                        데이터가 많아 일부만 표시됩니다. 필요 시 서버 환경변수 DATALENS_GRID_MAX_ROWS를 높여 전체를 더 크게 받아올 수 있습니다.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'chart' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {chartMeta?.title || (isGroupedMetricChart
                    ? `${groupMetric?.group_col}별 ${groupMetric?.value_col} 평균 비교`
                    : "그룹별 평균 비교")}
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  {primaryChartType === "line" ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="category" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey={primaryDataKey} stroke="#14B8A6" strokeWidth={3} name={primaryLegend} />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="category" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey={primaryDataKey} fill="#14B8A6" name={primaryLegend} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">{chartMeta?.secondary_title || "추세 분석"}</h3>
                {chartMeta?.description && (
                  <p className="text-sm text-muted-foreground mb-3">{chartMeta.description}</p>
                )}
                <ResponsiveContainer width="100%" height={300}>
                  {secondaryChartType === "bar" ? (
                    <BarChart data={secondaryPlotData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="category" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey={secondaryDataKey} fill="#8B5CF6" name={secondarySeriesName} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={secondaryPlotData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="category" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey={secondaryDataKey} stroke="#8B5CF6" strokeWidth={3} name={secondarySeriesName} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">실제 평균값 비교</h3>
                <p className="text-sm text-muted-foreground mb-4">표준화 값이 아닌 원본 평균(raw mean) 기준으로 주요 수치형 변수의 크기를 비교합니다.</p>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={rawMeanData.length > 0 ? rawMeanData : chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="category" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="value" stroke="#14B8A6" fill="#14B8A633" name={rawMeanData.length > 0 ? "원본 평균값" : "표준화 값"} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">변수별 결측치 상위</h3>
                  <p className="text-sm text-muted-foreground mb-4">결측치가 많은 변수부터 정렬해 데이터 정제 우선순위를 보여줍니다.</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={missingByColumn} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" stroke="#64748B" />
                      <YAxis dataKey="name" type="category" width={120} stroke="#64748B" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="missing" fill="#EF4444" name="결측치 수" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  {missingByColumn.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-3">결측치가 있는 변수가 없습니다.</p>
                  )}
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">데이터 타입 분포</h3>
                  <p className="text-sm text-muted-foreground mb-4">수치형/범주형/날짜형 변수 구성을 통해 가능한 분석 범위를 한눈에 확인합니다.</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dtypeDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={105}
                        label
                      >
                        {dtypeDistribution.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {dtypeDistribution.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-3">변수 정보를 불러오면 타입 분포가 표시됩니다.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-border p-5">
                  <p className="text-sm text-muted-foreground">데이터 완전성</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{completeness}%</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-5">
                  <p className="text-sm text-muted-foreground">결측치 총합</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{summary?.missing_total ?? 0}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-5">
                  <p className="text-sm text-muted-foreground">분석 변수 수</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{tableData.length}</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'insight' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-xl border border-border p-8">
                <h2 className="text-3xl font-bold text-foreground">{selectedFile ? `${selectedFile.name} 통계 분석 리포트` : "통계 분석 리포트"}</h2>
                <p className="text-muted-foreground mt-2">{today} · {recommendedMethod}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => { void handleDownloadPdf(); }}
                    disabled={!currentReportId || isDownloadingPdf}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90"
                  >
                    <FileDown size={16} />
                    {isDownloadingPdf ? "PDF 생성 중..." : "PDF 다운로드"}
                  </button>

                  {isSessionModified && (
                    <button
                      onClick={() => { void handleDownloadEditedExcel(); }}
                      disabled={!currentSessionId || isDownloadingExcel}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80"
                    >
                      <Sheet size={16} />
                      {isDownloadingExcel ? "엑셀 생성 중..." : "수정된 엑셀파일 다운로드"}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary to-accent/80 rounded-xl p-6 text-primary-foreground">
                <h3 className="text-xl font-bold mb-4">분석 요약</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm opacity-80">데이터 행 수</p>
                    <p className="text-2xl font-bold">{summary?.row_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">변수 개수</p>
                    <p className="text-2xl font-bold">{summary?.column_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">결측치</p>
                    <p className="text-2xl font-bold">{summary?.missing_total ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">통계 기법</p>
                    <p className="text-2xl font-bold">{analysisTechniqueCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-2xl font-bold text-foreground">1. 그룹별 지표 비교 분석</h3>
                <p className="text-muted-foreground">
                  {chartMeta?.description
                    ? `추천 기법: ${recommendedMethod}. ${chartMeta.description}`
                    : isGroupedMetricChart
                      ? `추천 기법: ${recommendedMethod}. ${groupMetric?.group_col} 집단별 ${groupMetric?.value_col} 원본 평균으로 표시했습니다.`
                      : `추천 기법: ${recommendedMethod}. 서로 단위가 다른 지표를 비교하기 위해 차트는 표준화(0~100) 값으로 표시했습니다.`}
                </p>
                <ResponsiveContainer width="100%" height={320}>
                  {primaryChartType === "line" ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="category" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey={primaryDataKey} stroke="#14B8A6" strokeWidth={3} name={primaryLegend} />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="category" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey={primaryDataKey} fill="#14B8A6" name={primaryLegend} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
                <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg">
                  <h4 className="font-semibold text-foreground mb-2">주요 발견사항</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {explanation || "분석 설명이 아직 없습니다."}
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-2xl font-bold text-foreground">{chartMeta?.secondary_title || (isGroupedMetricChart ? "2. 그룹 평균 추세" : "2. 변수 간 관계 분석")}</h3>
                <p className="text-muted-foreground">
                  {chartMeta?.description || (isGroupedMetricChart ? "그룹별 평균 흐름을 확인하고 통계 근거와 함께 해석합니다." : "차트와 통계 근거를 함께 검토해 상관 구조를 해석합니다.")}
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  {secondaryChartType === "bar" ? (
                    <BarChart data={secondaryPlotData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="category" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey={secondaryDataKey} fill="#8B5CF6" name={secondarySeriesName} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={secondaryPlotData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="category" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey={secondaryDataKey} stroke="#8B5CF6" strokeWidth={3} name={secondarySeriesName} />
                    </LineChart>
                  )}
                </ResponsiveContainer>

                {evidence && (
                  <div className="p-4 bg-secondary rounded-r-lg">
                    <h4 className="font-semibold text-foreground mb-2">통계 근거 요약</h4>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                      {JSON.stringify(evidence, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="space-y-3">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="p-4 bg-[#8B5CF6]/10 border-l-4 border-[#8B5CF6] rounded-r-lg">
                      <h4 className="font-semibold text-foreground mb-2">실무적 시사점 {idx + 1}</h4>
                      <p className="text-sm text-muted-foreground">{insight}</p>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <div className="p-4 bg-secondary rounded-r-lg">
                      <p className="text-sm text-muted-foreground">아직 인사이트가 없습니다. 파일 업로드 후 분석을 실행해 주세요.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-2xl font-bold text-foreground">3. 추가로 가능한 분석</h3>
                <p className="text-muted-foreground">
                  주 분석 외에도 아래 대안 분석을 수행할 수 있습니다. 목적에 맞는 분석을 선택해 질문으로 요청해 주세요.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {methodOptions.map((opt, idx) => (
                    <div key={idx} className="p-4 bg-secondary rounded-lg border border-border">
                      <h4 className="font-semibold text-foreground">{opt.method}</h4>
                      <p className="text-sm text-muted-foreground mt-2">사용 시점: {opt.when_to_use}</p>
                      <p className="text-sm text-muted-foreground mt-1">현재 데이터 적합도: {opt.current_fit}</p>
                      <button
                        className="mt-3 px-3 py-2 text-sm bg-accent text-accent-foreground rounded-lg hover:bg-accent/90"
                        onClick={() => {
                          setInput(`${opt.method}으로 추가 분석해줘`);
                        }}
                      >
                        이 분석 요청하기
                      </button>
                    </div>
                  ))}
                </div>
                {nextQuestion && (
                  <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg text-sm text-muted-foreground">
                    {nextQuestion}
                  </div>
                )}
              </div>

              <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <h3 className="text-2xl font-bold text-foreground">결론 및 권장사항</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {explanation || "결론을 생성하려면 파일을 업로드하고 분석을 실행해 주세요."}
                </p>
                <p className="text-sm text-muted-foreground">
                  다음 단계: 상위 영향 변수를 기준으로 추가 실험 또는 세분화 분석을 권장합니다.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}