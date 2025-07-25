import { Carousel } from '../../ui/Carousel' // You'll need to create or import a Carousel component
import { Icon } from '../../ui/Icon'

interface PropertyGalleryProps {
  images: string[]
}

export const PropertyGallery = ({ images }: PropertyGalleryProps) => {
  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
      {images.length > 0 ? (
        <Carousel>
          {images.map((image, index) => (
            <div key={index} className="relative h-full w-full">
              <img
                src={image}
                alt={`Property image ${index + 1}`}
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </Carousel>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          <Icon name="camera" className="w-12 h-12" />
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded-full text-sm shadow-sm">
        {images.length} photos
      </div>
    </div>
  )
}