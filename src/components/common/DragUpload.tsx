import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  X,
  Download,
  File,
  FileUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MaterialType } from '@/types';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: MaterialType;
  url?: string;
  progress?: number;
}

interface DragUploadProps {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  onFilesChange?: (files: UploadedFile[]) => void;
  className?: string;
  hint?: string;
}

function getFileIcon(type: MaterialType) {
  const iconClass = 'h-5 w-5';
  switch (type) {
    case 'pdf':
      return <FileText className={cn(iconClass, 'text-red-500')} />;
    case 'ppt':
      return <Presentation className={cn(iconClass, 'text-orange-500')} />;
    case 'doc':
      return <FileText className={cn(iconClass, 'text-primary-500')} />;
    case 'xlsx':
      return <FileSpreadsheet className={cn(iconClass, 'text-emerald-500')} />;
    case 'image':
      return <Image className={cn(iconClass, 'text-accent-500')} />;
    default:
      return <File className={cn(iconClass, 'text-neutral-500')} />;
  }
}

function detectFileType(file: File): MaterialType {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['ppt', 'pptx'].includes(ext || '')) return 'ppt';
  if (['doc', 'docx'].includes(ext || '')) return 'doc';
  if (['xls', 'xlsx'].includes(ext || '')) return 'xlsx';
  return 'pdf';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function DragUpload({
  accept = '.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif',
  maxSize = 50 * 1024 * 1024,
  multiple = true,
  onFilesChange,
  className,
  hint = '支持 PDF、Word、Excel、PPT、图片格式，单个文件不超过 50MB',
}: DragUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: UploadedFile[] = [];
      const fileArray = Array.from(fileList);

      fileArray.forEach((file) => {
        if (file.size > maxSize) return;

        const newFile: UploadedFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          type: detectFileType(file),
          progress: 100,
        };

        if (newFile.type === 'image') {
          newFile.url = URL.createObjectURL(file);
        }

        newFiles.push(newFile);
      });

      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
      setIsDragging(false);
    },
    [files, maxSize, multiple, onFilesChange],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        e.target.value = '';
      }
    },
    [processFiles],
  );

  const handleRemoveFile = useCallback(
    (id: string) => {
      const updatedFiles = files.filter((f) => f.id !== id);
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
    },
    [files, onFilesChange],
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300',
          isDragging
            ? 'border-accent-400 bg-accent-50 scale-[1.01] shadow-glow'
            : 'border-neutral-300 bg-neutral-50 hover:border-primary-300 hover:bg-primary-50/50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div
          className={cn(
            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300',
            isDragging
              ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-glow'
              : 'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-500',
          )}
        >
          {isDragging ? (
            <FileUp className="h-8 w-8 animate-bounce" />
          ) : (
            <UploadCloud className="h-8 w-8" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-neutral-800">
            {isDragging ? '释放文件到此处上传' : '拖拽文件到此处，或点击上传'}
          </p>
          <p className="text-xs text-neutral-500">{hint}</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-medium text-neutral-600">
              已上传 {files.length} 个文件
            </p>
          </div>

          <div className="space-y-2">
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
              >
                {uploadedFile.type === 'image' && uploadedFile.url ? (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                    <img
                      src={uploadedFile.url}
                      alt={uploadedFile.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    {getFileIcon(uploadedFile.type)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-800">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                  {uploadedFile.progress !== undefined && uploadedFile.progress < 100 && (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                        style={{ width: `${uploadedFile.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-primary-500"
                    title="下载"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveFile(uploadedFile.id)}
                    className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-danger-50 hover:text-danger-500"
                    title="删除"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
