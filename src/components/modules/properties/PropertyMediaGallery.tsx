import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Image, Trash2, Upload, Play, Maximize, Minimize, Film } from 'react-feather';
import { uploadFiles } from '../../../services/uploadService';
import { updateProperty } from '../../../services/propertyService';
import { useToast } from '../../ui/Toast';

type MediaType = 'image' | 'video' | 'video360';

interface MediaItem {
  url: string;
  type: MediaType;
}

function detectMediaType(url: string): MediaType {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogg'].includes(ext)) {
    if (url.toLowerCase().includes('360') || url.toLowerCase().includes('spherical')) {
      return 'video360';
    }
    return 'video';
  }
  return 'image';
}

function mergeMedia(images?: string[] | null, videos?: string[] | null): MediaItem[] {
  const imagesArr = Array.isArray(images) ? images : [];
  const videosArr = Array.isArray(videos) ? videos : [];
  const seen = new Set<string>();
  const result: MediaItem[] = [];
  for (const url of imagesArr) {
    if (!seen.has(url)) { seen.add(url); result.push({ url, type: detectMediaType(url) }); }
  }
  for (const url of videosArr) {
    if (!seen.has(url)) { seen.add(url); result.push({ url, type: detectMediaType(url) }); }
  }
  return result;
}

interface PropertyMediaGalleryProps {
  property: any;
  editable?: boolean;
  variant?: 'carousel' | 'grid';
  onUpdated?: (property: any) => void;
  isGerant?: boolean;
}

export const PropertyMediaGallery = ({ property, editable, variant = 'carousel', onUpdated, isGerant = false }: PropertyMediaGalleryProps) => {
  const [media, setMedia] = useState<MediaItem[]>(() => mergeMedia(property.images, property.videos));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [uploadingVideo360, setUploadingVideo360] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const video360InputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMedia(mergeMedia(property.images, property.videos));
  }, [property.images, property.videos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalOpen) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') goModalPrev();
      if (e.key === 'ArrowRight') goModalNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, modalIndex, media]);

  const saveMedia = useCallback(async (images: string[], videos: string[]) => {
    try {
      const updated = await updateProperty(property.id, {
        ...property,
        images,
        photos: images,
        videos,
      });
      if (onUpdated) onUpdated(updated);
      toast('success', 'Médias mis à jour');
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la sauvegarde');
    }
  }, [property, onUpdated, toast]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhotos(true);
    try {
      const urls = await uploadFiles(files);
      const newImages = [...(property.images || []), ...urls];
      await saveMedia(newImages, property.videos || []);
    } catch (err: any) {
      toast('error', err.message || 'Échec du téléchargement');
    } finally {
      setUploadingPhotos(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingVideos(true);
    try {
      const urls = await uploadFiles(files);
      const newVideos = [...(property.videos || []), ...urls];
      await saveMedia(property.images || [], newVideos);
    } catch (err: any) {
      toast('error', err.message || 'Échec du téléchargement');
    } finally {
      setUploadingVideos(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleVideo360Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingVideo360(true);
    try {
      const urls = await uploadFiles(files);
      const tagged = urls.map((u: string) => u.replace(/(\.\w+)$/, '_360$1'));
      const newVideos = [...(property.videos || []), ...tagged];
      await saveMedia(property.images || [], newVideos);
    } catch (err: any) {
      toast('error', err.message || 'Échec du téléchargement');
    } finally {
      setUploadingVideo360(false);
      if (video360InputRef.current) video360InputRef.current.value = '';
    }
  };

  const deleteMedia = async (index: number) => {
    const item = media[index];
    if (!item) return;
    let newImages = property.images || [];
    let newVideos = property.videos || [];
    if (item.type === 'image') {
      newImages = newImages.filter((u: string) => u !== item.url);
    } else {
      newVideos = newVideos.filter((u: string) => u !== item.url);
    }
    const totalAfter = newImages.length + newVideos.length;
    if (currentIndex >= totalAfter) {
      setCurrentIndex(Math.max(0, totalAfter - 1));
    }
    await saveMedia(newImages, newVideos);
  };

  const openModal = (index: number) => {
    setModalIndex(index);
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const goModalPrev = () => setModalIndex(i => (i - 1 + media.length) % media.length);
  const goModalNext = () => setModalIndex(i => (i + 1) % media.length);

  const zoomIn = () => setZoom(z => Math.min(z + 0.5, 5));
  const zoomOut = () => {
    setZoom(z => {
      const next = z - 0.5;
      if (next < 1) { setPanX(0); setPanY(0); return 1; }
      return next;
    });
  };
  const resetZoom = () => { setZoom(1); setPanX(0); setPanY(0); };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => setIsDragging(false);

  const goNext = () => setCurrentIndex(i => (i + 1) % media.length);
  const goPrev = () => setCurrentIndex(i => (i - 1 + media.length) % media.length);

  if (media.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className={`h-64 bg-gradient-to-br via-background to-violet-50 flex items-center justify-center ${isGerant ? 'from-[#905D5D]/15' : 'from-accent-light'}`}>
          <div className="text-center">
            <Image size={48} className="text-text-secondary/20 mx-auto" />
            <p className="text-sm text-text-secondary/40 mt-2">Aucun média</p>
          </div>
        </div>
        {editable && (
          <div className="p-4 border-t border-border/30">
            <UploadControls
              photoRef={photoInputRef} videoRef={videoInputRef} video360Ref={video360InputRef}
              onPhotoUpload={handlePhotoUpload} onVideoUpload={handleVideoUpload} onVideo360Upload={handleVideo360Upload}
              uploadingPhotos={uploadingPhotos} uploadingVideos={uploadingVideos} uploadingVideo360={uploadingVideo360}
            />
          </div>
        )}
      </div>
    );
  }

  const current = media[currentIndex];

  return (
    <>
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className={`relative h-64 sm:h-80 bg-gradient-to-br to-background group ${isGerant ? 'from-[#905D5D]/15' : 'from-accent-light'}`}>
          {current.type === 'image' ? (
            <img
              src={current.url}
              alt={`Média ${currentIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => openModal(currentIndex)}
            />
          ) : (
            <div className="relative w-full h-full cursor-pointer" onClick={() => openModal(currentIndex)}>
              <video
                src={current.url}
                className="w-full h-full object-cover"
                muted
                loop
                onMouseEnter={e => (e.target as HTMLVideoElement).play()}
                onMouseLeave={e => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Play size={24} className="text-white ml-1" />
                </div>
              </div>
              {current.type === 'video360' && (
                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium flex items-center gap-1">
                  <Film size={12} /> 360°
                </div>
              )}
            </div>
          )}

          {media.length > 1 && (
            <>
              <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
                <ChevronLeft size={18} />
              </button>
              <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
                <ChevronRight size={18} />
              </button>
            </>
          )}

          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-sm text-white text-xs">
            {currentIndex + 1} / {media.length}
          </div>

          {media.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {media.map((_, i) => (
                <button key={i} onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'}`} />
              ))}
            </div>
          )}

          {editable && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => deleteMedia(currentIndex)}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-red-500/70 transition-all"
                title="Supprimer">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {media.length > 1 && (
          <div className="flex gap-2 p-2 overflow-x-auto scrollbar-thin">
            {media.map((item, i) => (
              <button key={i} onClick={() => setCurrentIndex(i)}
                className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all border-2 relative ${i === currentIndex ? (isGerant ? 'border-[#905D5D]' : 'border-accent') + ' opacity-100' : 'border-transparent opacity-60 hover:opacity-80'}`}>
                {item.type === 'image' ? (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-black/10 flex items-center justify-center">
                    <Play size={14} className="text-text-secondary/60" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {editable && (
          <div className="p-4 border-t border-border/30">
            <UploadControls
              photoRef={photoInputRef} videoRef={videoInputRef} video360Ref={video360InputRef}
              onPhotoUpload={handlePhotoUpload} onVideoUpload={handleVideoUpload} onVideo360Upload={handleVideo360Upload}
              uploadingPhotos={uploadingPhotos} uploadingVideos={uploadingVideos} uploadingVideo360={uploadingVideo360}
            />
          </div>
        )}
      </div>

      {modalOpen && media[modalIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <button onClick={closeModal} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all z-10">
            <X size={20} />
          </button>

          {media.length > 1 && (
            <>
              <button onClick={goModalPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all z-10">
                <ChevronLeft size={22} />
              </button>
              <button onClick={goModalNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all z-10">
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
            {media[modalIndex].type === 'image' && (
              <>
                <button onClick={zoomOut} className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all" title="Zoom arrière">
                  <ZoomOut size={16} />
                </button>
                <span className="text-white/60 text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={zoomIn} className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all" title="Zoom avant">
                  <ZoomIn size={16} />
                </button>
                <button onClick={resetZoom} className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all" title="Réinitialiser">
                  <Maximize size={14} />
                </button>
              </>
            )}
            <span className="text-white/50 text-xs ml-3">{modalIndex + 1} / {media.length}</span>
          </div>

          <div ref={modalContentRef}
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center overflow-hidden select-none"
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}>
            {media[modalIndex].type === 'image' ? (
              <img src={media[modalIndex].url} alt=""
                className="max-w-full max-h-full transition-transform duration-200"
                style={{ transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)` }}
                draggable={false} />
            ) : (
              <video src={media[modalIndex].url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg" />
            )}
          </div>
        </div>
      )}
    </>
  );
};

function UploadControls({ photoRef, videoRef, video360Ref, onPhotoUpload, onVideoUpload, onVideo360Upload, uploadingPhotos, uploadingVideos, uploadingVideo360 }: {
  photoRef: React.RefObject<HTMLInputElement | null>;
  videoRef: React.RefObject<HTMLInputElement | null>;
  video360Ref: React.RefObject<HTMLInputElement | null>;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideo360Upload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingPhotos: boolean;
  uploadingVideos: boolean;
  uploadingVideo360: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <input type="file" ref={photoRef} accept="image/*" multiple className="hidden" onChange={onPhotoUpload} />
      <button type="button" disabled={uploadingPhotos} onClick={() => photoRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 cursor-pointer transition-all disabled:opacity-50">
        <Upload size={12} /> {uploadingPhotos ? 'Upload...' : 'Photos'}
      </button>

      <input type="file" ref={videoRef} accept="video/*" multiple className="hidden" onChange={onVideoUpload} />
      <button type="button" disabled={uploadingVideos} onClick={() => videoRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 cursor-pointer transition-all disabled:opacity-50">
        <Upload size={12} /> {uploadingVideos ? 'Upload...' : 'Vidéos'}
      </button>

      <input type="file" ref={video360Ref} accept="video/*" multiple className="hidden" onChange={onVideo360Upload} />
      <button type="button" disabled={uploadingVideo360} onClick={() => video360Ref.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer transition-all disabled:opacity-50">
        <Film size={12} /> {uploadingVideo360 ? 'Upload...' : 'Vidéos 360°'}
      </button>
    </div>
  );
}
