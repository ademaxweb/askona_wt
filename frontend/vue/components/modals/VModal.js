const VModal = {
    emits: ["close"],
    template: `
        <div class="modal_wrapper" @click.self="$emit('close')" @keyup.esc="$emit('close')">
            <div class="modal">
                <slot></slot>
            </div>
        </div>
    `
}