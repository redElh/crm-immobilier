import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Image, Trash2, Upload, Play, Maximize, Film } from 'react-feather';
import { uploadFiles } from '../../../services/uploadService';
import { updateProperty } from '../../../services/propertyService';
import { useToast } from '../../ui/Toast';
import { useStageChrome } from '../calendar/useStageChrome';
import { STAGE_HUES, OrbIcon } from '../../dashboard/Stage';

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
  const { staged, dark } = useStageChrome();

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

  /* ===================================================================
     STAGE variant — cosmic lightbox viewer for the properties detail page
  =================================================================== */

  if (staged) {
    const current = media[currentIndex];

    if (media.length === 0) {
      return (
        <div className="stage-glass rounded-2xl overflow-hidden">
          <div className="relative h-64 flex items-center justify-center overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: dark ? 'radial-gradient(circle at 50% 60%, rgba(124,92,255,0.14), transparent 70%)' : 'radial-gradient(circle at 50% 60%, rgba(13,148,136,0.12), transparent 70%)' }}
            />
            <div className="relative text-center">
              <OrbIcon icon={Image} hue={dark ? STAGE_HUES.violet : STAGE_HUES.sky} size={54} radius={17} />
              <p className={`mt-3 text-sm font-semibold ${dark ? 'text-slate-400' : 'text-teal-900/55'}`}>Aucun média</p>
              <p className={`mt-0.5 text-xs ${dark ? 'text-slate-600' : 'text-teal-900/35'}`}>
                {editable ? 'Importez photos, vidéos et visites 360°' : 'Ce bien n\'a pas encore de médias'}
              </p>
            </div>
          </div>
          {editable && (
            <div className="border-t p-4" style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)' }}>
              <StageUploadControls
                photoRef={photoInputRef} videoRef={videoInputRef} video360Ref={video360InputRef}
                onPhotoUpload={handlePhotoUpload} onVideoUpload={handleVideoUpload} onVideo360Upload={handleVideo360Upload}
                uploadingPhotos={uploadingPhotos} uploadingVideos={uploadingVideos} uploadingVideo360={uploadingVideo360}
              />
            </div>
          )}
        </div>
      );
    }

    const TYPE_CHIP = {
      image: { label: 'Photo', icon: Image, hue: STAGE_HUES.sky },
      video: { label: 'Vidéo', icon: Play, hue: STAGE_HUES.fuchsia },
      video360: { label: 'Visite 360°', icon: Film, hue: STAGE_HUES.amber },
    } as const;
    const chip = TYPE_CHIP[current.type];

    return (
      <>
        <div className="stage-glass rounded-2xl overflow-hidden">
          {/* ── Main viewer ──────────────────────────────────────────── */}
          <div className="group relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-black/40">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {current.type === 'image' ? (
                  <img
                    src={current.url}
                    alt={`Média ${currentIndex + 1}`}
                    className="h-full w-full cursor-zoom-in object-cover"
                    onClick={() => openModal(currentIndex)}
                  />
                ) : (
                  <div className="relative h-full w-full cursor-pointer" onClick={() => openModal(currentIndex)}>
                    <video
                      src={current.url}
                      className="h-full w-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={e => (e.target as HTMLVideoElement).play()}
                      onMouseLeave={e => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                      <motion.div
                        whileHover={{ scale: 1.12 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                        className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 backdrop-blur-md"
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.42)',
                          boxShadow: `0 0 34px ${chip.hue.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                        }}
                      >
                        <Play size={24} className="ml-1 text-white" fill="white" />
                      </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* cinematic bottom gradient */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />

            {/* media-type chip */}
            <div
              className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md"
              style={{
                borderColor: `${chip.hue.a}55`,
                backgroundColor: 'rgba(0,0,0,0.45)',
                boxShadow: `0 0 14px ${chip.hue.glow}`,
                color: chip.hue.a,
              }}
            >
              <chip.icon size={11} />
              {chip.label}
            </div>

            {/* nav orbs */}
            {media.length > 1 && (
              <>
                <button onClick={goPrev} aria-label="Précédent"
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white opacity-0 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-black/55 group-hover:opacity-100">
                  <ChevronLeft size={17} />
                </button>
                <button onClick={goNext} aria-label="Suivant"
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white opacity-0 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-black/55 group-hover:opacity-100">
                  <ChevronRight size={17} />
                </button>
              </>
            )}

            {/* counter */}
            <div className="absolute bottom-3 right-3 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums text-white backdrop-blur-md">
              {String(currentIndex + 1).padStart(2, '0')} <span className="text-white/40">/ {String(media.length).padStart(2, '0')}</span>
            </div>

            {/* progress dots */}
            {media.length > 1 && (
              <div className="absolute bottom-3.5 left-1/2 flex -translate-x-1/2 gap-1.5">
                {media.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`Média ${i + 1}`}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === currentIndex ? 22 : 7,
                      backgroundColor: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                      boxShadow: i === currentIndex ? `0 0 10px rgba(255,255,255,0.7)` : 'none',
                    }}
                  />
                ))}
              </div>
            )}

            {/* delete orb */}
            {editable && (
              <div className="absolute right-3 top-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button onClick={() => deleteMedia(currentIndex)} title="Supprimer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-red-400/30 bg-black/40 text-red-300 backdrop-blur-md transition-all hover:scale-110 hover:bg-red-500/60 hover:text-white">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>

          {/* ── Thumbnails strip ─────────────────────────────────────── */}
          {media.length > 1 && (
            <div className="scrollbar-thin overflow-x-auto p-2.5" style={{
              transform: 'translateZ(0)',
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch' as any,
            }}>
              <div className="flex min-w-max gap-2">
                {media.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`Miniature ${i + 1}`}
                    className={`relative h-12 w-[68px] shrink-0 overflow-hidden rounded-xl border transition-all duration-200 ${i === currentIndex ? '' : 'opacity-55 hover:opacity-85'}`}
                    style={i === currentIndex ? {
                      borderColor: `${STAGE_HUES.violet.a}88`,
                      boxShadow: `0 0 16px ${STAGE_HUES.violet.glow}`,
                    } : { borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ background: item.type === 'video360'
                          ? 'linear-gradient(135deg, rgba(251,191,36,0.16), rgba(180,83,9,0.10))'
                          : 'linear-gradient(135deg, rgba(232,121,249,0.16), rgba(162,28,175,0.10))' }}
                      >
                        {item.type === 'video360'
                          ? <Film size={15} style={{ color: STAGE_HUES.amber.a }} />
                          : <Play size={14} style={{ color: STAGE_HUES.fuchsia.a }} />}
                      </div>
                    )}
                    {item.type !== 'image' && (
                      <span className="absolute bottom-0.5 right-1 text-[8px] font-bold uppercase tracking-wider text-white/70">
                        {item.type === 'video360' ? '360°' : 'VID'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Upload controls ──────────────────────────────────────── */}
          {editable && (
            <div className="border-t p-4" style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)' }}>
              <StageUploadControls
                photoRef={photoInputRef} videoRef={videoInputRef} video360Ref={video360InputRef}
                onPhotoUpload={handlePhotoUpload} onVideoUpload={handleVideoUpload} onVideo360Upload={handleVideo360Upload}
                uploadingPhotos={uploadingPhotos} uploadingVideos={uploadingVideos} uploadingVideo360={uploadingVideo360}
              />
            </div>
          )}
        </div>

        {/* ── Cosmic / Lagoon lightbox — portaled so it floats above everything ── */}
        {createPortal(
          <AnimatePresence>
            {modalOpen && media[modalIndex] && (() => {
              const lb = dark ? {
                veil: 'rgba(2,4,12,0.88)',
                glows: [
                  'radial-gradient(circle, rgba(124,92,255,0.20), transparent 65%)',
                  'radial-gradient(circle, rgba(34,211,238,0.14), transparent 65%)',
                  'radial-gradient(circle, rgba(232,121,249,0.08), transparent 60%)',
                ],
                scrim: 'linear-gradient(180deg, rgba(2,4,12,0.75), transparent)',
                chipBg: 'rgba(255,255,255,0.04)',
                chipText: chip.hue.a,
                orb: 'border-white/15 bg-white/[0.06] text-white hover:bg-white/15 hover:border-white/30',
                dockBorder: 'rgba(255,255,255,0.12)',
                dockBg: 'rgba(8,11,26,0.72)',
                ctrl: 'text-white/70 hover:bg-white/10 hover:text-white',
                pct: 'text-indigo-300',
                sep: 'bg-white/10',
                frameBorder: 'rgba(255,255,255,0.12)',
                frameBg: 'rgba(255,255,255,0.02)',
                frameShadow: `0 0 90px -20px ${chip.hue.glow}, 0 60px 140px -40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.10)`,
                dotActive: '#FFFFFF',
                dotActiveGlow: '0 0 8px rgba(255,255,255,0.65)',
                dotIdle: 'rgba(255,255,255,0.30)',
              } : {
                veil: 'rgba(236,253,245,0.86)',
                glows: [
                  'radial-gradient(circle, rgba(13,148,136,0.16), transparent 65%)',
                  'radial-gradient(circle, rgba(56,189,248,0.14), transparent 65%)',
                  'radial-gradient(circle, rgba(52,211,153,0.10), transparent 60%)',
                ],
                scrim: 'linear-gradient(180deg, rgba(236,253,245,0.85), transparent)',
                chipBg: 'rgba(255,255,255,0.75)',
                chipText: chip.hue.b,
                orb: 'border-teal-900/12 bg-white/70 text-slate-600 hover:bg-white hover:border-teal-900/30 hover:text-teal-900',
                dockBorder: 'rgba(13,148,136,0.18)',
                dockBg: 'rgba(255,255,255,0.82)',
                ctrl: 'text-slate-500 hover:bg-teal-900/[0.07] hover:text-teal-900',
                pct: 'text-teal-700',
                sep: 'bg-teal-900/10',
                frameBorder: 'rgba(13,148,136,0.22)',
                frameBg: 'rgba(255,255,255,0.55)',
                frameShadow: `0 0 80px -24px ${dark ? chip.hue.glow : 'rgba(13,148,136,0.45)'}, 0 50px 120px -44px rgba(6,78,59,0.55), inset 0 1px 0 rgba(255,255,255,0.95)`,
                dotActive: '#0F766E',
                dotActiveGlow: '0 0 8px rgba(13,148,136,0.55)',
                dotIdle: 'rgba(13,148,136,0.28)',
              };

              return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: lb.veil, backdropFilter: 'blur(22px)' }}
                onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}
              >
                {/* ambient aurora glows */}
                <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full"
                  style={{ background: lb.glows[0], filter: 'blur(60px)' }} />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -right-32 h-[520px] w-[520px] rounded-full"
                  style={{ background: lb.glows[1], filter: 'blur(70px)' }} />
                <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/3 h-[380px] w-[380px] -translate-x-1/2 rounded-full"
                  style={{ background: lb.glows[2], filter: 'blur(60px)' }} />

                {/* top chrome */}
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-5 py-4"
                  style={{ background: lb.scrim }}
                >
                  <span
                    className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-xl"
                    style={{
                      color: lb.chipText,
                      borderColor: `${chip.hue.a}45`,
                      backgroundColor: lb.chipBg,
                      boxShadow: `0 0 18px -4px ${chip.hue.glow}`,
                    }}
                  >
                    <chip.icon size={12} />
                    {chip.label}
                    <span className={`font-mono tabular-nums ${dark ? 'text-white/40' : 'text-teal-900/40'}`}>{String(modalIndex + 1).padStart(2, '0')} / {String(media.length).padStart(2, '0')}</span>
                  </span>
                  <motion.button
                    onClick={closeModal}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-xl transition-colors ${lb.orb}`}
                  >
                    <X size={19} />
                  </motion.button>
                </motion.div>

                {/* side nav orbs */}
                {media.length > 1 && (
                  <>
                    <button onClick={goModalPrev} aria-label="Précédent"
                      className={`absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-xl transition-all hover:scale-110 ${lb.orb}`}>
                      <ChevronLeft size={21} />
                    </button>
                    <button onClick={goModalNext} aria-label="Suivant"
                      className={`absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-xl transition-all hover:scale-110 ${lb.orb}`}>
                      <ChevronRight size={21} />
                    </button>
                  </>
                )}

                {/* media frame */}
                <motion.div
                  ref={modalContentRef}
                  initial={{ scale: 0.94, opacity: 0, y: 18 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.96, opacity: 0, y: 10 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                  className="relative z-10 flex max-h-[78vh] w-[min(92vw,1200px)] select-none items-center justify-center overflow-hidden rounded-3xl border"
                  onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                  style={{
                    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    borderColor: lb.frameBorder,
                    background: lb.frameBg,
                    boxShadow: lb.frameShadow,
                  }}
                >
                  {media[modalIndex].type === 'image' ? (
                    <img src={media[modalIndex].url} alt=""
                      className="max-h-[76vh] max-w-full object-contain transition-transform duration-200"
                      style={{ transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)` }}
                      draggable={false} />
                  ) : (
                    <video src={media[modalIndex].url} controls autoPlay className="max-h-[76vh] w-full object-contain" />
                  )}
                </motion.div>

                {/* bottom control bar */}
                <motion.div
                  initial={{ opacity: 0, y: 16, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  transition={{ delay: 0.1 }}
                  className="absolute bottom-6 left-1/2 z-20 flex items-center gap-2 rounded-2xl border px-3 py-2 backdrop-blur-2xl"
                  style={{
                    borderColor: lb.dockBorder,
                    background: lb.dockBg,
                    boxShadow: dark
                      ? '0 16px 44px -14px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)'
                      : '0 16px 44px -16px rgba(6,78,59,0.45), inset 0 1px 0 rgba(255,255,255,0.95)',
                  }}
                >
                  {media[modalIndex].type === 'image' && (
                    <>
                      <button onClick={zoomOut} title="Zoom arrière"
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-90 ${lb.ctrl}`}>
                        <ZoomOut size={16} />
                      </button>
                      <span className={`w-12 text-center font-mono text-[11px] font-bold tabular-nums ${lb.pct}`}>{Math.round(zoom * 100)}%</span>
                      <button onClick={zoomIn} title="Zoom avant"
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-90 ${lb.ctrl}`}>
                        <ZoomIn size={16} />
                      </button>
                      <button onClick={resetZoom} title="Réinitialiser"
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-90 ${lb.ctrl}`}>
                        <Maximize size={13} />
                      </button>
                      <span className={`mx-1 h-5 w-px ${lb.sep}`} />
                    </>
                  )}
                  {/* quick-jump dots */}
                  {media.length > 1 && (
                    <div className="flex items-center gap-1.5 px-1">
                      {media.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setModalIndex(i)}
                          aria-label={`Aller au média ${i + 1}`}
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: i === modalIndex ? 18 : 6,
                            backgroundColor: i === modalIndex ? lb.dotActive : lb.dotIdle,
                            boxShadow: i === modalIndex ? lb.dotActiveGlow : 'none',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
              );
            })()}
          </AnimatePresence>,
          document.body,
        )}
      </>
    );
  }

  /* ===================================================================
     Legacy variant (admin shell) — unchanged
  =================================================================== */

  const current = media[currentIndex];

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

/* ---------------------------------------------------------------------
   Stage upload controls — glass pills with per-media hue accents
--------------------------------------------------------------------- */

function StageUploadControls({ photoRef, videoRef, video360Ref, onPhotoUpload, onVideoUpload, onVideo360Upload, uploadingPhotos, uploadingVideos, uploadingVideo360 }: {
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
  const pills = [
    { inputRef: photoRef, accept: 'image/*', onChange: onPhotoUpload, busy: uploadingPhotos, label: 'Photos', hue: STAGE_HUES.sky },
    { inputRef: videoRef, accept: 'video/*', onChange: onVideoUpload, busy: uploadingVideos, label: 'Vidéos', hue: STAGE_HUES.fuchsia },
    { inputRef: video360Ref, accept: 'video/*', onChange: onVideo360Upload, busy: uploadingVideo360, label: 'Vidéos 360°', hue: STAGE_HUES.amber },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        <Upload size={11} /> Importer
      </span>
      {pills.map((pill, i) => (
        <span key={i}>
          <input type="file" ref={pill.inputRef} accept={pill.accept} multiple className="hidden" onChange={pill.onChange} />
          <motion.button
            type="button"
            disabled={pill.busy}
            whileTap={{ scale: 0.95 }}
            onClick={() => pill.inputRef.current?.click()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              color: pill.hue.a,
              borderColor: `${pill.hue.a}38`,
              backgroundImage: `linear-gradient(145deg, ${pill.hue.a}14, transparent)`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {pill.busy ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Upload size={12} />
            )}
            {pill.busy ? 'Upload…' : pill.label}
          </motion.button>
        </span>
      ))}
    </div>
  );
}

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
