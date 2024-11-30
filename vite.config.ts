import { defineConfig } from 'vite';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
    // baseプロパティに設定する値
    let base = "/"

    console.log(mode)

    // 本番時に適用させるbaseの値
    if (mode === "production") {
        base = "/face-sample/"
    }

    return {
        base: base,
    };
})
