import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  Presentation,
  FileSpreadsheet,
  Image as ImageIcon,
  Eye,
  Download,
  Trash2,
  X,
  FileUp,
  ZoomIn,
  FileWarning,
  Clock,
  User as UserIcon,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Material, MaterialType, User } from '@/types';
import { formatFileSize } from '@/utils/formatters';

interface MaterialPanelProps {
  materials: Material[];
  users?: User[];
  onAdd?: (material: Omit<Material, 'id' | 'uploadedAt'>) => void;
  onRemove?: (materialId: string) => void;
  readOnly?: boolean;
}

const typeIcons: Record<MaterialType, typeof FileText> = {
  pdf: FileText,
  ppt: Presentation,
  doc: FileText,
  xlsx: FileSpreadsheet,
  image: ImageIcon,
};

const typeColors: Record<MaterialType, string> = {
  pdf: 'text-danger-500 bg-danger-50',
  ppt: 'text-warning-500 bg-warning-50',
  doc: 'text-primary-500 bg-primary-50',
  xlsx: 'text-success-500 bg-success-50',
  image: 'text-accent-500 bg-accent-50',
};

const typeLabels: Record<MaterialType, string> = {
  pdf: 'PDF',
  ppt: 'PPT',
  doc: 'DOC',
  xlsx: 'XLSX',
  image: '图片',
};

const typeGradientColors: Record<MaterialType, string> = {
  pdf: 'from-danger-500 to-danger-600',
  ppt: 'from-warning-500 to-warning-600',
  doc: 'from-primary-500 to-primary-600',
  xlsx: 'from-success-500 to-success-600',
  image: 'from-accent-500 to-accent-600',
};

function getTypeFromFilename(filename: string): MaterialType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'ppt' || ext === 'pptx') return 'ppt';
  if (ext === 'doc' || ext === 'docx') return 'doc';
  if (ext === 'xls' || ext === 'xlsx') return 'xlsx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  return 'doc';
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface PreviewContentProps {
  material: Material;
  uploader?: User;
  onDownload: (material: Material) => void;
}

function ImagePreviewContent({ material }: PreviewContentProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [material.url]);

  return (
    <>
      <div className="relative flex-1 flex items-center justify-center bg-neutral-50 p-4 md:p-8 overflow-auto">
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-accent-500 animate-spin" />
              <p className="text-sm text-neutral-400">图片加载中...</p>
            </div>
          </div>
        )}
        {hasError && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center">
              <FileWarning className="w-8 h-8 text-danger-500" />
            </div>
            <div className="text-center">
              <p className="text-neutral-700 font-medium mb-1">图片加载失败</p>
              <p className="text-sm text-neutral-400">请尝试下载后查看</p>
            </div>
          </div>
        )}
        <img
          src={material.url}
          alt={material.name}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={cn(
            'max-w-full max-h-full object-contain rounded-xl shadow-lg transition-opacity duration-300 cursor-zoom-in',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onClick={() => !hasError && setIsZoomed(true)}
        />
        {!isLoading && !hasError && (
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute bottom-6 right-6 p-3 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-all backdrop-blur-sm"
            title="放大查看"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        )}
      </div>

      {isZoomed && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 animate-fade-in cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 p-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
            onClick={() => setIsZoomed(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={material.url}
            alt={material.name}
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        </div>
      )}
    </>
  );
}

function PdfPreviewContent({ material, onDownload }: PreviewContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const timer = setTimeout(() => {
      if (containerRef.current) {
        const iframe = containerRef.current.querySelector('iframe');
        const embed = containerRef.current.querySelector('embed');
        if (iframe) {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc || iframeDoc.body.innerHTML === '') {
              setHasError(true);
            }
          } catch {
            setHasError(true);
          }
        }
        if (!embed && !iframe) {
          setHasError(true);
        }
      }
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [material.url]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-neutral-100 max-w-sm w-full text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-warning-50 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-warning-500" />
          </div>
          <h4 className="text-lg font-semibold text-neutral-800 mb-2">预览加载失败</h4>
          <p className="text-sm text-neutral-500 mb-6">
            无法在线预览此PDF文件，建议下载后查看
          </p>
          <button
            onClick={() => onDownload(material)}
            className="w-full btn-primary"
          >
            <Download className="w-4 h-4" />
            下载文件
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex-1 bg-neutral-50 overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-accent-500 animate-spin" />
            <p className="text-sm text-neutral-400">PDF加载中...</p>
          </div>
        </div>
      )}
      <object
        data={material.url}
        type="application/pdf"
        className="w-full h-full"
        onLoad={handleLoad}
        onError={handleError}
      >
        <iframe
          src={material.url}
          title={material.name}
          className="w-full h-full"
          onLoad={handleLoad}
          onError={handleError}
        />
      </object>
    </div>
  );
}

function OfficePreviewContent({ material, uploader, onDownload }: PreviewContentProps) {
  const Icon = typeIcons[material.type];
  const gradientClass = typeGradientColors[material.type];

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-neutral-50 to-primary-50/30">
      <div className="bg-white rounded-3xl shadow-xl border border-neutral-100 max-w-md w-full overflow-hidden">
        <div className={cn('p-8 bg-gradient-to-br', gradientClass)}>
          <div className="flex items-start justify-between">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-10 h-10 text-white" />
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-sm font-medium backdrop-blur-sm">
              {typeLabels[material.type]}
            </span>
          </div>
          <h3 className="mt-5 text-white text-xl font-semibold line-clamp-2">
            {material.name}
          </h3>
          <p className="mt-1 text-white/70 text-sm">
            {formatFileSize(material.size)}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">文件格式</p>
              <p className="text-sm text-neutral-700 font-medium">
                {typeLabels[material.type]} 文档
              </p>
            </div>
          </div>

          {uploader && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
              <img
                src={uploader.avatar}
                alt={uploader.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">上传者</p>
                <p className="text-sm text-neutral-700 font-medium">
                  {uploader.name}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
            <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">上传时间</p>
              <p className="text-sm text-neutral-700 font-medium">
                {formatDate(material.uploadedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-50 border border-warning-100">
            <AlertCircle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-700 mb-1">
                在线预览不可用
              </p>
              <p className="text-xs text-warning-600/80">
                该文件类型暂不支持在线预览，建议下载后使用对应办公软件查看
              </p>
            </div>
          </div>

          <button
            onClick={() => onDownload(material)}
            className="w-full btn-primary py-3 text-base mt-2"
          >
            <Download className="w-5 h-5" />
            下载文件
          </button>
        </div>
      </div>
    </div>
  );
}

interface PreviewModalProps {
  material: Material;
  uploader?: User;
  onClose: () => void;
  onDownload: (material: Material) => void;
}

function PreviewModal({ material, uploader, onClose, onDownload }: PreviewModalProps) {
  const TypeIcon = typeIcons[material.type];

  const renderContent = () => {
    switch (material.type) {
      case 'image':
        return <ImagePreviewContent material={material} uploader={uploader} onDownload={onDownload} />;
      case 'pdf':
        return <PdfPreviewContent material={material} uploader={uploader} onDownload={onDownload} />;
      case 'doc':
      case 'ppt':
      case 'xlsx':
        return <OfficePreviewContent material={material} uploader={uploader} onDownload={onDownload} />;
      default:
        return <OfficePreviewContent material={material} uploader={uploader} onDownload={onDownload} />;
    }
  };

  const showFooter = material.type !== 'image';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                typeColors[material.type]
              )}
            >
              <TypeIcon className="w-5 h-5 md:w-[22px] md:h-[22px]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-neutral-800 font-semibold text-sm md:text-base truncate">
                {material.name}
              </h4>
              <p className="text-neutral-400 text-xs md:text-sm">
                {formatFileSize(material.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-2">
            <button
              onClick={() => onDownload(material)}
              className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm text-neutral-600 hover:bg-neutral-100 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">下载</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 md:p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {renderContent()}
        </div>

        {showFooter && (
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-t border-neutral-100 bg-neutral-50 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <UserIcon className="w-4 h-4" />
              <span>{uploader?.name || '未知用户'}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{formatDate(material.uploadedAt)}</span>
            </div>
            <button
              onClick={() => onDownload(material)}
              className="btn-accent px-4 py-2 text-sm"
            >
              <Download className="w-4 h-4" />
              下载
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MaterialPanel({
  materials,
  users = [],
  onAdd,
  onRemove,
  readOnly = false,
}: MaterialPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUploader = (uploaderId: string) =>
    users.find((u) => u.id === uploaderId);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (!onAdd) return;
      const fileArray = Array.from(files);
      fileArray.forEach((file) => {
        const type = getTypeFromFilename(file.name);
        const mockUrl =
          type === 'image'
            ? URL.createObjectURL(file)
            : `https://example.com/files/${file.name}`;

        onAdd({
          name: file.name,
          type,
          size: file.size,
          uploadedBy: users[0]?.id || 'user-001',
          url: mockUrl,
        });
      });
    },
    [onAdd, users]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDownload = (material: Material) => {
    const link = document.createElement('a');
    link.href = material.url;
    link.download = material.name;
    link.target = '_blank';
    link.click();
  };

  const TypeIcon = ({ type }: { type: MaterialType }) => {
    const Icon = typeIcons[type];
    return (
      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center',
          typeColors[type]
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-neutral-100">
      <div className="px-6 py-4 bg-gradient-primary flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">会议材料</h3>
          <p className="text-primary-100 text-sm mt-0.5">
            共 {materials.length} 个文件
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={handleClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-primary-600 hover:bg-primary-50 transition-all text-sm font-medium"
          >
            <FileUp className="w-4 h-4" />
            上传文件
          </button>
        )}
      </div>

      {!readOnly && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          className={cn(
            'mx-6 mt-5 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-accent-400 bg-accent-50/70 scale-[1.01]'
              : 'border-neutral-200 hover:border-accent-300 hover:bg-neutral-50/50'
          )}
        >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleInputChange}
          accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.svg"
        />
        <div
          className={cn(
            'w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all',
            isDragging ? 'bg-accent-500 text-white' : 'bg-neutral-100 text-neutral-400'
          )}
        >
          <Upload className="w-7 h-7" />
        </div>
        <p className="text-neutral-700 font-medium mb-1">
          {isDragging ? '释放以上传文件' : '拖拽文件到此处，或点击选择'}
        </p>
        <p className="text-neutral-400 text-xs">
          支持 PDF、PPT、Word、Excel、图片格式
        </p>
        </div>
      )}

      <div className="px-6 py-5">
        {materials.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
            <p className="text-neutral-400 text-sm">暂无会议材料</p>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => {
              const uploader = getUploader(material.uploadedBy);
              return (
                <div
                  key={material.id}
                  className="group flex items-center gap-4 p-3.5 rounded-xl border border-neutral-100 hover:border-accent-200 hover:bg-accent-50/30 transition-all"
                >
                  <TypeIcon type={material.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-neutral-800 font-medium text-sm truncate">
                        {material.name}
                      </p>
                      <span
                        className={cn(
                          'flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-medium',
                          typeColors[material.type]
                        )}
                      >
                        {typeLabels[material.type]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                      <span>{formatFileSize(material.size)}</span>
                      <span>·</span>
                      <span>{formatDate(material.uploadedAt)}</span>
                      {uploader && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <img
                              src={uploader.avatar}
                              alt={uploader.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            {uploader.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    'flex-shrink-0 flex items-center gap-1 transition-opacity',
                    readOnly ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}>
                    <button
                      onClick={() => setPreviewMaterial(material)}
                      className="p-2 rounded-lg text-neutral-400 hover:bg-accent-50 hover:text-accent-600 transition-all"
                      title="预览"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(material)}
                      className="p-2 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-all"
                      title="下载"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => onRemove?.(material.id)}
                        className="p-2 rounded-lg text-neutral-400 hover:bg-danger-50 hover:text-danger-500 transition-all"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewMaterial && (
        <PreviewModal
          material={previewMaterial}
          uploader={getUploader(previewMaterial.uploadedBy)}
          onClose={() => setPreviewMaterial(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
