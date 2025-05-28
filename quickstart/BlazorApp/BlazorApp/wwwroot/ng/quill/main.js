class QuillBlazor {
    constructor() {
        this.instances = new Map();
        this.loadedResources = {
            quill: false
        };
    }

    async loadResources() {
        if (!this.loadedResources.quill) {
            await this.loadCSS('https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css');
            await this.loadScript('https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js');
            this.loadedResources.quill = true;
        }

        // Asegurar que Quill esté disponible globalmente
        await this.ensureQuillReady();
    }

    ensureQuillReady() {
        return new Promise((resolve) => {
            const checkQuill = () => {
                if (typeof window.Quill !== 'undefined') {
                    resolve();
                } else {
                    // Reintenta cada 10ms hasta que Quill esté disponible
                    setTimeout(checkQuill, 10);
                }
            };
            checkQuill();
        });
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    loadCSS(href) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    // Función helper para crear selectores CSS válidos
    createValidSelector(id) {
        // Si el ID comienza con un número, usar selector de atributo
        if (/^[0-9]/.test(id)) {
            return `[id="${id}"]`;
        }
        // Si es válido, usar selector de ID normal
        return `#${id}`;
    }

    // Función helper para obtener elemento por ID (manejando IDs inválidos)
    getElementById(id) {
        // Intentar primero con getElementById (más eficiente)
        let element = document.getElementById(id);

        // Si no se encuentra y el ID comienza con número, usar querySelector con selector de atributo
        if (!element && /^[0-9]/.test(id)) {
            element = document.querySelector(`[id="${id}"]`);
        }

        return element;
    }

    async initializeQuill(editorId, containerId, options, dotNetRef) {
        try {
            await this.loadResources();

            // Usar helper para obtener elementos
            const container = this.getElementById(containerId);
            if (!container) {
                throw new Error(`Container with id ${containerId} not found`);
            }

            const editorElement = this.getElementById(editorId);
            if (!editorElement) {
                throw new Error(`Editor element with id ${editorId} not found`);
            }

            // Crear selector válido para Quill
            const editorSelector = this.createValidSelector(editorId);

            // Crear instancia de Quill usando el selector válido
            const quill = new Quill(editorSelector, options);

            // Configurar callback para cambios de contenido
            quill.on('text-change', (delta, oldDelta, source) => {
                if (source === 'user' && dotNetRef) {
                    const content = quill.root.innerHTML;
                    dotNetRef.invokeMethodAsync('OnContentChanged', content);
                }
            });

            // Guardar referencia
            this.instances.set(editorId, {
                quill: quill,
                dotNetRef: dotNetRef,
                containerId: containerId
            });

            console.log('Quill configurado exitosamente para:', editorId);
        } catch (error) {
            console.error('Error inicializando Quill:', error);
            throw error;
        }
    }

    setContent(editorId, content) {
        const instance = this.instances.get(editorId);
        if (instance) {
            // Usar pasteHTML para establecer contenido HTML
            instance.quill.root.innerHTML = content;
        }
    }

    getContent(editorId) {
        const instance = this.instances.get(editorId);
        if (instance) {
            return instance.quill.root.innerHTML;
        }
        return '';
    }

    getText(editorId) {
        const instance = this.instances.get(editorId);
        if (instance) {
            return instance.quill.getText();
        }
        return '';
    }

    clear(editorId) {
        const instance = this.instances.get(editorId);
        if (instance) {
            instance.quill.setContents([]);
        }
    }

    setReadOnly(editorId, readOnly) {
        const instance = this.instances.get(editorId);
        if (instance) {
            instance.quill.enable(!readOnly);
        }
    }

    destroyQuill(editorId) {
        const instance = this.instances.get(editorId);
        if (instance) {
            try {
                // Quill no tiene un método destroy explícito, pero podemos limpiar
                instance.quill.off('text-change');
                this.instances.delete(editorId);
            } catch (error) {
                console.warn('Error destruyendo Quill:', error);
            }
        }
    }
}

window.quillBlazor = new QuillBlazor();

export function initializeQuill(editorId, containerId, options, dotNetRef) {
    return window.quillBlazor.initializeQuill(editorId, containerId, options, dotNetRef);
}

export function setContent(editorId, content) {
    return window.quillBlazor.setContent(editorId, content);
}

export function getContent(editorId) {
    return window.quillBlazor.getContent(editorId);
}

export function getText(editorId) {
    return window.quillBlazor.getText(editorId);
}

export function clear(editorId) {
    return window.quillBlazor.clear(editorId);
}

export function setReadOnly(editorId, readOnly) {
    return window.quillBlazor.setReadOnly(editorId, readOnly);
}

export function destroyQuill(editorId) {
    return window.quillBlazor.destroyQuill(editorId);
}