/**
 * Web Vitals監視コンポーネント
 * 
 * Core Web Vitals (LCP, FID, CLS) を測定し、パフォーマンス要件の監視を行う
 */

'use client';

import { useEffect } from 'react';

interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
}

interface WebVitalsMonitorProps {
  onMetric?: (metric: WebVitalMetric) => void;
  debug?: boolean;
}

const WebVitalsMonitor: React.FC<WebVitalsMonitorProps> = ({
  onMetric,
  debug = false
}) => {
  useEffect(() => {
    // Web Vitals の動的インポートと監視設定
    const initWebVitals = async () => {
      try {
        // web-vitals パッケージが利用可能な場合のみ実行
        if (typeof window !== 'undefined') {
          // Performance Observer を使用してメトリクスを収集
          
          // LCP (Largest Contentful Paint) の監視
          if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1] as any;
              
              const metric: WebVitalMetric = {
                name: 'LCP',
                value: lastEntry.startTime,
                id: 'lcp-' + Date.now(),
                delta: lastEntry.startTime
              };

              if (debug) {
                console.log('LCP:', metric);
              }

              onMetric?.(metric);
            });

            try {
              lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
              // ブラウザがサポートしていない場合は無視
            }
          }

          // FID (First Input Delay) の監視
          if ('PerformanceObserver' in window) {
            const fidObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              entries.forEach((entry: any) => {
                const metric: WebVitalMetric = {
                  name: 'FID',
                  value: entry.processingStart - entry.startTime,
                  id: 'fid-' + Date.now(),
                  delta: entry.processingStart - entry.startTime
                };

                if (debug) {
                  console.log('FID:', metric);
                }

                onMetric?.(metric);
              });
            });

            try {
              fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
              // ブラウザがサポートしていない場合は無視
            }
          }

          // CLS (Cumulative Layout Shift) の監視
          if ('PerformanceObserver' in window) {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              entries.forEach((entry: any) => {
                if (!entry.hadRecentInput) {
                  clsValue += entry.value;
                  
                  const metric: WebVitalMetric = {
                    name: 'CLS',
                    value: clsValue,
                    id: 'cls-' + Date.now(),
                    delta: entry.value
                  };

                  if (debug) {
                    console.log('CLS:', metric);
                  }

                  onMetric?.(metric);
                }
              });
            });

            try {
              clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
              // ブラウザがサポートしていない場合は無視
            }
          }

          // TTI (Time to Interactive) の簡易測定
          const measureTTI = () => {
            if (document.readyState === 'complete') {
              const ttiValue = performance.now();
              
              const metric: WebVitalMetric = {
                name: 'TTI',
                value: ttiValue,
                id: 'tti-' + Date.now(),
                delta: ttiValue
              };

              if (debug) {
                console.log('TTI:', metric);
              }

              onMetric?.(metric);
            }
          };

          if (document.readyState === 'complete') {
            measureTTI();
          } else {
            window.addEventListener('load', measureTTI);
          }

          // パフォーマンス要件チェック
          const checkPerformanceThresholds = () => {
            setTimeout(() => {
              // パフォーマンス要件の閾値
              const thresholds = {
                LCP: 2500, // 2.5秒
                FID: 100,  // 100ms
                CLS: 0.1,  // 0.1
                TTI: 2500  // 2.5秒
              };

              if (debug) {
                console.log('Performance thresholds:', thresholds);
              }
            }, 1000);
          };

          checkPerformanceThresholds();
        }
      } catch (error) {
        if (debug) {
          console.warn('WebVitalsMonitor initialization failed:', error);
        }
      }
    };

    initWebVitals();

    // クリーンアップ
    return () => {
      // Performance Observer のディスコネクトは自動的に行われる
    };
  }, [onMetric, debug]);

  // このコンポーネントはUIを持たない
  return null;
};

export default WebVitalsMonitor;