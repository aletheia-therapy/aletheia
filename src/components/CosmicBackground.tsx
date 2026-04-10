'use client';

import { useEffect, useRef } from 'react';

interface CosmicBackgroundProps {
  emotion?: string;
}

export function CosmicBackground({ emotion = '平靜' }: CosmicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設定畫布大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 情感色彩映射
    const getEmotionColor = (emotion: string) => {
      const colorMap: Record<string, string> = {
        焦慮: '#FF8C42',
        悲傷: '#6B7280',
        憤怒: '#EF4444',
        恐懼: '#8B5CF6',
        喜悅: '#FBBF24',
        平靜: '#60A5FA',
        希望: '#34D399',
        困惑: '#A78BFA',
      };
      return colorMap[emotion] || '#60A5FA';
    };

    const emotionColor = getEmotionColor(emotion);

    // 星雲背景層
    const drawNebulaBackground = () => {
      // 創建徑向漸層 - 模擬星雲
      const gradient1 = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.3, 0,
        canvas.width * 0.3, canvas.height * 0.3, canvas.width * 0.6
      );
      gradient1.addColorStop(0, 'rgba(30, 144, 255, 0.15)');    // 深藍
      gradient1.addColorStop(0.5, 'rgba(0, 128, 128, 0.08)');   // 青綠
      gradient1.addColorStop(1, 'rgba(0, 0, 0, 0)');

      const gradient2 = ctx.createRadialGradient(
        canvas.width * 0.7, canvas.height * 0.6, 0,
        canvas.width * 0.7, canvas.height * 0.6, canvas.width * 0.5
      );
      gradient2.addColorStop(0, 'rgba(138, 43, 226, 0.12)');    // 紫色
      gradient2.addColorStop(0.5, 'rgba(0, 206, 209, 0.08)');   // 青色
      gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');

      const gradient3 = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.8, 0,
        canvas.width * 0.5, canvas.height * 0.8, canvas.width * 0.4
      );
      gradient3.addColorStop(0, 'rgba(0, 255, 127, 0.1)');      // 翠綠
      gradient3.addColorStop(0.5, 'rgba(72, 61, 139, 0.06)');   // 深紫
      gradient3.addColorStop(1, 'rgba(0, 0, 0, 0)');

      // 繪製星雲層
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = gradient3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // 星星類別
    class Star {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      opacity: number;
      opacityDirection: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 1.5 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.5;
        this.opacityDirection = Math.random() > 0.5 ? 0.01 : -0.01;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.opacity += this.opacityDirection;

        if (this.opacity >= 1 || this.opacity <= 0.3) {
          this.opacityDirection *= -1;
        }

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();

        // 星星光暈
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius * 3
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 創建星星
    const stars: Star[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push(new Star());
    }

    // 動畫循環
    const animate = () => {
      // 深邃的太空背景
      ctx.fillStyle = '#050a15';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 繪製星雲背景
      drawNebulaBackground();

      // 繪製並更新星星
      stars.forEach(star => {
        star.update();
        star.draw();
      });

      // 整體氛圍光暈（根據情感）
      const atmosphereGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
      );
      atmosphereGradient.addColorStop(0, `${emotionColor}08`);
      atmosphereGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmosphereGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [emotion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}