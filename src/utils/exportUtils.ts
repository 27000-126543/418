import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

interface ExportColumn<T> {
  key: keyof T;
  title: string;
  width?: number;
  format?: (value: T[keyof T], row: T) => string;
}

export const exportToPDF = async (
  elementId: string,
  filename: string = 'document.pdf',
  options: {
    orientation?: 'portrait' | 'landscape';
    scale?: number;
    margin?: number;
  } = {}
): Promise<void> => {
  const { orientation = 'portrait', scale = 2, margin = 10 } = options;
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const pdfHeight = pdf.internal.pageSize.getHeight() - margin * 2;
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgX = margin + (pdfWidth - imgWidth * ratio) / 2;
  const imgY = margin + (pdfHeight - imgHeight * ratio) / 2;

  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
  pdf.save(filename);
};

export const exportMeetingReportToPDF = (
  report: {
    title: string;
    meetingTitle: string;
    date: string;
    startTime: string;
    endTime: string;
    attendanceRate: number;
    plannedDuration: string;
    actualDuration: string;
    keyDecisions: string[];
    roomName: string;
    attendees: { name: string; department: string; status: string }[];
  },
  filename: string = 'meeting-report.pdf'
): void => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = 20;
  const leftMargin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(report.title, pageWidth / 2, y, { align: 'center' });
  y += 15;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('会议基本信息', leftMargin, y);
  y += 8;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const basicInfo = [
    ['会议主题', report.meetingTitle],
    ['会议日期', report.date],
    ['开始时间', report.startTime],
    ['结束时间', report.endTime],
    ['会议室', report.roomName],
    ['计划时长', report.plannedDuration],
    ['实际时长', report.actualDuration],
    ['出席率', `${report.attendanceRate}%`],
  ];

  basicInfo.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label}:`, leftMargin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(value), leftMargin + 35, y);
    y += 7;
  });

  y += 5;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('参会人员', leftMargin, y);
  y += 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  report.attendees.forEach((att) => {
    pdf.text(`${att.name} | ${att.department} | ${att.status}`, leftMargin + 5, y);
    y += 6;
  });

  y += 5;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('关键决策', leftMargin, y);
  y += 8;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  report.keyDecisions.forEach((decision, idx) => {
    const lines = pdf.splitTextToSize(`${idx + 1}. ${decision}`, pageWidth - leftMargin * 2);
    pdf.text(lines, leftMargin + 5, y);
    y += lines.length * 6 + 2;
  });

  pdf.save(filename);
};

export const exportToExcel = <T extends Record<string, unknown>>(
  data: T[],
  filename: string = 'data.xlsx',
  sheetName: string = 'Sheet1',
  columns?: ExportColumn<T>[]
): void => {
  let exportData: Record<string, unknown>[];

  if (columns && columns.length > 0) {
    exportData = data.map((row) => {
      const newRow: Record<string, unknown> = {};
      columns.forEach((col) => {
        const value = row[col.key];
        newRow[col.title] = col.format ? col.format(value, row) : value;
      });
      return newRow;
    });
  } else {
    exportData = data as Record<string, unknown>[];
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  if (columns && columns.length > 0) {
    const colWidths = columns.map((col) => ({
      wch: col.width || Math.max(
        String(col.title).length + 2,
        12
      ),
    }));
    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

export const exportStatisticsToExcel = (
  statistics: {
    month: string;
    totalMeetings: number;
    totalMeetingHours: number;
    averageAttendanceRate: number;
    cateringExpense: number;
  }[],
  filename: string = 'statistics.xlsx'
): void => {
  const workbook = XLSX.utils.book_new();

  const summaryData = statistics.map((s) => ({
    '月份': s.month,
    '会议总数': s.totalMeetings,
    '会议总时长(小时)': s.totalMeetingHours,
    '平均出席率(%)': s.averageAttendanceRate,
    '餐饮支出(元)': s.cateringExpense,
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, '月度汇总');

  XLSX.writeFile(workbook, filename);
};

export const downloadCSV = <T extends Record<string, unknown>>(
  data: T[],
  filename: string = 'data.csv',
  columns?: ExportColumn<T>[]
): void => {
  let headers: string[];
  let rows: string[][];

  if (columns && columns.length > 0) {
    headers = columns.map((c) => c.title);
    rows = data.map((row) =>
      columns.map((col) => {
        const value = row[col.key];
        const formatted = col.format ? col.format(value, row) : String(value ?? '');
        return `"${formatted.replace(/"/g, '""')}"`;
      })
    );
  } else {
    headers = Object.keys(data[0] || {});
    rows = data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`)
    );
  }

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
