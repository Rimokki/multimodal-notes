import { reactive } from 'vue'

const colors = ['#FFCB6B', '#FB5151', '#A975FF', '#FD9170', '#68CEF8', '#9DEF8F', '#000000']

let _editor: any = null

interface CanvasState {
  color: string
  size: number
  eraser: boolean
}

const state = reactive<CanvasState>({
  color: '#FFCB6B',
  size: 3,
  eraser: false,
})

export function useCanvasState() {
  return {
    colors,
    state,
    setActiveCanvas(editor: any) {
      _editor = editor
      state.eraser = false
    },
  }
}
