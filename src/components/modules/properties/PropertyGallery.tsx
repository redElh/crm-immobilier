import { useState } from 'react';
import { ChevronLeft, ChevronRight, Image } from 'react-feather';

export const PropertyGallery = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = () => setCurrentIndex(i => (i + 1) % images.length);
  const goPrev = () => setCurrentIndex(i => (i - 1 + images.length) % images.length);

  if (images.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="h-64 bg-gradient-to-br from-accent-light via-background to-violet-50 flex items-center justify-center">
          <div className="text-center">
            <Image size={48} className="text-text-secondary/20 mx-auto" />
            <p className="text-sm text-text-secondary/40 mt-2">Aucune image</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-accent-light to-background">
        <img
          src={images[currentIndex]}
          alt={`Photo ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-sm text-white text-xs">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 p-2 overflow-x-auto scrollbar-thin">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all border-2 ${
                i === currentIndex ? 'border-accent opacity-100' : 'border-transparent opacity-60 hover:opacity-80'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
