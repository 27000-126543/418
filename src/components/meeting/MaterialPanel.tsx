import { useState, useRef, useCallback } from 'react';
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

function getTypeFromFilename(filename: string): MaterialType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'ppt' || ext === 'pptx') return 'ppt';
  if (ext === 'doc' || ext === 'docx') return 'doc';
  if (ext === 'xls' || ext === 'xlsx') return 'xlsx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  return 'doc';
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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
                        onClick={() => onRemove(material.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <TypeIcon type={previewMaterial.type} />
                <div>
                  <h4 className="text-neutral-800 font-semibold">
                    {previewMaterial.name}
                  </h4>
                  <p className="text-neutral-400 text-xs">
                    {formatFileSize(previewMaterial.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewMaterial)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 transition-all"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-neutral-50 p-6">
              {previewMaterial.type === 'image' ? (
                <img
                  src={previewMaterial.url}
                  alt={previewMaterial.name}
                  className="max-w-full max-h-full mx-auto rounded-xl shadow-lg"
                />
              ) : (
                <div className="h-[500px] bg-white rounded-xl border border-neutral-200">
                  <iframe
                    src={previewMaterial.url}
                    title={previewMaterial.name}
                    className="w-full h-full rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
