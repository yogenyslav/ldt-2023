import React, { useEffect, useState, forwardRef } from 'react';

interface CustomHeaderVideoProps {
  src: string;
  headers: Record<string, string>;
  style?: React.CSSProperties;
  controls?: boolean;
}

const CustomHeaderVideo = forwardRef<HTMLVideoElement, CustomHeaderVideoProps>(({ src, headers, style, controls = true }, ref) => {
  const [videoSrc, setVideoSrc] = useState<string | undefined>();

  useEffect(() => {
    fetchVideo();
  }, [src]);

  const fetchVideo = async () => {
    const response = await fetch(src, {
      headers: headers,
    });

    const videoBlob = await response.blob();
    const videoURL = URL.createObjectURL(videoBlob);

    setVideoSrc(videoURL);
  };

  return <video src={videoSrc} controls={controls} style={style} ref={ref} />;
});

export default CustomHeaderVideo;