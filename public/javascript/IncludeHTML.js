class IncludeHTML extends HTMLElement {
    async connectedCallback() {
        const src = this.getAttribute('src');
        if (src) {
            try{
            const response = await fetch(src);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                this.innerHTML = await response.text();
            } catch (error) {
                console.error('Error al importar el archivo HTML:', error);
            }
        }
    }
}
customElements.define('include-html', IncludeHTML);
