import { useState, useEffect, useCallback, useRef } from 'react';
import type { ExecutionResult } from '@/types/execution';
import type { PyodideInterface } from 'pyodide';

export function usePyodide() {
    const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);

    // Pyodide 초기화 (한 번만 실행)
    useEffect(() => {
        if (loadingRef.current) return;
        loadingRef.current = true;

        const loadPyodide = async () => {
            try {
                // CDN에서 Pyodide 스크립트 로드
                const script = document.createElement('script');
                script.src =
                    'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';

                await new Promise<void>((resolve, reject) => {
                    script.onload = () => resolve();
                    script.onerror = () =>
                        reject(new Error('Pyodide 스크립트 로드 실패'));
                    document.head.appendChild(script);
                });

                // @ts-expect-error - loadPyodide는 CDN 스크립트에서 전역으로 제공됨
                const pyodideInstance = await window.loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
                });

                setPyodide(pyodideInstance);
                setLoading(false);
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : '알 수 없는 오류가 발생했습니다.';
                setError(errorMessage);
                setLoading(false);
            }
        };

        loadPyodide();
    }, []);

    // 코드 실행
    const executeCode = useCallback(
        async (code: string): Promise<ExecutionResult> => {
            if (!pyodide) {
                throw new Error('Pyodide가 아직 로드되지 않았습니다.');
            }

            const startTime = performance.now();
            let output = '';
            let error: string | null = null;
            const images: string[] = [];

            try {
                // 필요한 패키지 자동 감지 및 로드
                const packagesToLoad: string[] = [];
                if (code.includes('matplotlib')) {
                    packagesToLoad.push('matplotlib');
                }
                if (code.includes('numpy') || code.includes('np.')) {
                    packagesToLoad.push('numpy');
                }
                if (code.includes('pandas') || code.includes('pd.')) {
                    packagesToLoad.push('pandas');
                }

                // 패키지 로드
                if (packagesToLoad.length > 0) {
                    await pyodide.loadPackage(packagesToLoad);
                }

                // stdout/stderr 캡처를 위한 설정
                pyodide.setStdout({
                    batched: (msg: string) => {
                        output += msg + '\n';
                    },
                });

                pyodide.setStderr({
                    batched: (msg: string) => {
                        output += msg + '\n';
                    },
                });

                // matplotlib 이미지 캡처 설정
                await pyodide.runPythonAsync(`
import sys
import io
from js import document

# matplotlib 백엔드 설정
try:
    import matplotlib
    matplotlib.use('AGG')
    import matplotlib.pyplot as plt

    _original_show = plt.show
    _images = []

    def _custom_show():
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        import base64
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        _images.append(img_str)
        plt.close()

    plt.show = _custom_show
except ImportError:
    pass
`);

                // 사용자 코드 실행
                await pyodide.runPythonAsync(code);

                // matplotlib 이미지 수집
                try {
                    const pyImages = pyodide.globals.get('_images');
                    if (
                        pyImages &&
                        typeof pyImages === 'object' &&
                        'toJs' in pyImages
                    ) {
                        const imageList = (
                            pyImages as { toJs: () => string[] }
                        ).toJs();
                        images.push(...imageList);
                    }
                } catch {
                    // matplotlib 미사용 시 무시
                }
            } catch (err) {
                error =
                    err instanceof Error
                        ? err.message
                        : '코드 실행 중 오류가 발생했습니다.';
            }

            const executionTime = performance.now() - startTime;

            return {
                output: output.trim(),
                error,
                executionTime,
                images: images.length > 0 ? images : undefined,
            };
        },
        [pyodide],
    );

    return {
        pyodide,
        loading,
        error,
        executeCode,
    };
}
