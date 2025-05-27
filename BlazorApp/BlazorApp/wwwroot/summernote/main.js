class SummernoteBlazor {
    constructor()
    {
        this.instances = new Map();
        this.loadedResources =
        {
            bootstrap: false,
            summernote: false
        };
    }

    async loadResources()
    {
        if (!this.loadedResources.bootstrap)
        {
            await this.loadCSS('https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/css/bootstrap.min.css');
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js');
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/js/bootstrap.bundle.min.js');
            this.loadedResources.bootstrap = true;
        }

        if (!this.loadedResources.summernote)
        {
            //await this.loadCSS('https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-bs4.min.css');
            await this.loadCSS('./summernote/summernote-bs4.css');
            //await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-bs4.min.js');
            await this.loadScript('./summernote/summernote-bs4.min.js');

            // Cargar idioma español
            //await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/lang/summernote-es-ES.min.js');
            await this.loadScript('./summernote/lang/summernote-es-ES.min.js');
            this.loadedResources.summernote = true;
        }
    }

    loadScript(src)
    {
        return new Promise((resolve, reject) =>
        {
            if (document.querySelector(`script[src="${src}"]`))
            {
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
        return new Promise((resolve, reject) =>
        {
            if (document.querySelector(`link[href="${href}"]`))
            {
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

    async initializeSummernote(editorId, containerId, options, dotNetRef)
    {
        try {
            await this.loadResources();

            // Esperar un momento para asegurar que jQuery esté disponible
            await new Promise(resolve => setTimeout(resolve, 100));

            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container with id ${containerId} not found`);
            }

            // Aislar estilos aplicando un namespace específico
            container.classList.add('summernote-isolated');

            // Configurar Summernote con callbacks
            const summernoteOptions = {
                ...options,
                lang: 'es-ES',
                callbacks: {
                    onChange: (contents, $editable) => {
                        if (dotNetRef) {
                            dotNetRef.invokeMethodAsync('OnContentChanged', contents);
                        }
                    },
                    onInit: () => {
                        console.log('Summernote inicializado:', editorId);
                    }
                }
            };

            // Inicializar Summernote
            const $editor = $(`#${editorId}`);
            $editor.summernote(summernoteOptions);

            // Guardar referencia
            this.instances.set(editorId, {
                element: $editor,
                dotNetRef: dotNetRef,
                containerId: containerId
            });

            console.log('Summernote configurado exitosamente para:', editorId);

        } catch (error) {
            console.error('Error inicializando Summernote:', error);
            throw error;
        }
    }

    setContent(editorId, content) {
        const instance = this.instances.get(editorId);
        if (instance) {
            instance.element.summernote('code', content);
        }
    }

    getContent(editorId) {
        const instance = this.instances.get(editorId);
        if (instance) {
            return instance.element.summernote('code');
        }
        return '';
    }

    clear(editorId) {
        const instance = this.instances.get(editorId);
        if (instance) {
            instance.element.summernote('reset');
        }
    }

    destroySummernote(editorId) {
        const instance = this.instances.get(editorId);
        if (instance) {
            try {
                instance.element.summernote('destroy');
                this.instances.delete(editorId);
            } catch (error) {
                console.warn('Error destruyendo Summernote:', error);
            }
        }
    }

    handleChange(contents) {
        // Esta función se mantiene para compatibilidad
        console.log('Contenido cambiado:', contents);
    }
}


window.summernoteBlazor = new SummernoteBlazor();

export function initializeSummernote(editorId, containerId, options, dotNetRef)
{
    return window.summernoteBlazor.initializeSummernote(editorId, containerId, options, dotNetRef);
}

export function setContent(editorId, content)
{
    return window.summernoteBlazor.setContent(editorId, content);
}

export function getContent(editorId) {
    return window.summernoteBlazor.getContent(editorId);
}

export function clear(editorId) {
    return window.summernoteBlazor.clear(editorId);
}

export function destroySummernote(editorId)
{
    return window.summernoteBlazor.destroySummernote(editorId);
}