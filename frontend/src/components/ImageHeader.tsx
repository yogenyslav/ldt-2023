import React, { useEffect, useState } from 'react';

interface CustomHeaderImageProps {
  src: string;
  alt?: string;
  headers: Record<string, string>;
  style?: React.CSSProperties;
  className?: string;
}

const CustomHeaderImage: React.FC<CustomHeaderImageProps> = ({ src, alt, headers, style, className }) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>();

  useEffect(() => {
    fetchImage();
  }, [src]);

  const fetchImage = async () => {
    const response = await fetch(src, {
      headers: headers,
    });

    const imageBlob = await response.blob();
    const imageURL = URL.createObjectURL(imageBlob);

    setImageSrc(imageURL);
  };

  return <img src={imageSrc} alt={alt} style={style} className={className} />;
}

export default CustomHeaderImage;
