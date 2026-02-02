
import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, Maximize2, Monitor, Square, Smartphone, Hash } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  initialAspect?: number;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ image, initialAspect = 1, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(initialAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  // Pixel Dimension State
  const [pixelWidth, setPixelWidth] = useState<number>(1200);
  const [pixelHeight, setPixelHeight] = useState<number>(400);

  const onCropChange = (crop: { x: number; y: number }) => setCrop(crop);
  const onZoomChange = (zoom: number) => setZoom(zoom);

  const onCropCompleteInternal = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const commonSizes = [
    { label: 'ব্যানার (1200x400)', w: 1200, h: 400 },
    { label: 'ফুল এইচডি (1920x1080)', w: 1920, h: 1080 },
    { label: 'বর্গাকার (1000x1000)', w: 1000, h: 1000 },
    { label: 'স্মার্টফোন (1080x1920)', w: 1080, h: 1920 },
  ];

  useEffect(() => {
    setAspect(pixelWidth / pixelHeight);
  }, [pixelWidth, pixelHeight]);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // We use the requested pixel dimensions for the output
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        pixelWidth,
        pixelHeight
      );

      onCropComplete(canvas.toDataURL('image/jpeg', 0.9));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-[95vh]">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-black text-slate-800">ছবি ক্রপ করুন ও সাইজ দিন</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">পিক্সেল সাইজ নির্ধারণ করুন</p>
          </div>
          <button onClick={onCancel} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={24} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex-1 relative bg-slate-200">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="p-8 space-y-6 bg-white border-t border-slate-100 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dimension Selection */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">সাইজ প্রিসেট</p>
              <div className="grid grid-cols-2 gap-2">
                {commonSizes.map((size) => (
                  <button
                    key={size.label}
                    onClick={() => { setPixelWidth(size.w); setPixelHeight(size.h); }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all ${pixelWidth === size.w && pixelHeight === size.h ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
                  >
                    <Maximize2 size={14} />
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Pixel Input */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">কাস্টম পিক্সেল (Pixel)</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">প্রস্থ (Width)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" 
                    value={pixelWidth} 
                    onChange={e => setPixelWidth(Number(e.target.value))} 
                  />
                </div>
                <div className="pt-5 text-slate-300 font-bold">X</div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">উচ্চতা (Height)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" 
                    value={pixelHeight} 
                    onChange={e => setPixelHeight(Number(e.target.value))} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 max-w-md mx-auto py-2">
            <ZoomIn className="text-slate-400 shrink-0" size={24} />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100"
            >
              বাতিল
            </button>
            <button
              onClick={getCroppedImg}
              className="flex-1 py-4 px-6 rounded-2xl font-black text-white bg-blue-600 shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Check size={20} strokeWidth={3} /> সেভ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
