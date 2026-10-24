import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { createEditorialFallbackSvg } from '../utils/format';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
  fallbackSrc?: string;
  fallbackTitle?: string;
};

export default function SmartImage({
  src,
  fallbackSrc,
  fallbackTitle = 'کارن',
  alt = '',
  onError,
  ...rest
}: Props) {
  const [stage, setStage] = useState<'primary' | 'secondary' | 'svg'>('primary');

  useEffect(() => {
    setStage('primary');
  }, [src, fallbackSrc]);

  const resolvedSrc =
    stage === 'primary'
      ? src
      : stage === 'secondary' && fallbackSrc
        ? fallbackSrc
        : createEditorialFallbackSvg(fallbackTitle || alt);

  return (
    <img
      {...rest}
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={(e) => {
        if (stage === 'primary' && fallbackSrc) {
          setStage('secondary');
        } else if (stage !== 'svg') {
          setStage('svg');
        }
        onError?.(e);
      }}
    />
  );
}
