// Remote cursors extension using ProseMirror decorations
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const pluginKey = new PluginKey('remoteCursors')

function createDecorations(doc, cursors = []) {
  const decorations = []

  cursors.forEach((c) => {
    if (typeof c.from !== 'number' || typeof c.to !== 'number') return
    const color = c.color || '#3b82f6'
    const name = c.name || 'User'

    // Selection highlight
    if (c.to > c.from) {
      decorations.push(
        Decoration.inline(c.from, c.to, {
          style: `background: ${color}33; border-radius: 2px;`,
          'data-remote-selection': c.clientId,
        })
      )
    }

    // Caret
    const caretEl = document.createElement('span')
    caretEl.className = 'remote-caret'
    caretEl.style.borderLeft = `2px solid ${color}`
    caretEl.style.marginLeft = '-1px'
    caretEl.style.borderRight = 'none'
    caretEl.style.pointerEvents = 'none'
    caretEl.style.position = 'relative'
    caretEl.style.display = 'inline-block'
    caretEl.style.height = '1em'

    const label = document.createElement('span')
    label.textContent = name
    label.style.position = 'absolute'
    label.style.top = '-1.2em'
    label.style.left = '0'
    label.style.background = color
    label.style.color = '#fff'
    label.style.fontSize = '10px'
    label.style.padding = '1px 4px'
    label.style.borderRadius = '3px'
    label.style.whiteSpace = 'nowrap'
    label.style.transform = 'translateX(-50%)'
    caretEl.appendChild(label)

    decorations.push(
      Decoration.widget(c.to, caretEl, { key: `caret-${c.clientId}` })
    )
  })

  return DecorationSet.create(doc, decorations)
}

const RemoteCursors = Extension.create({
  name: 'remoteCursors',

  addOptions() {
    return {
      cursors: [],
    }
  },

  addCommands() {
    return {
      updateCursors:
        (cursors) => ({ tr, state, dispatch }) => {
          if (dispatch) {
            dispatch(tr.setMeta(pluginKey, { cursors }))
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const self = this
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init: (_, { doc }) => createDecorations(doc, self.options.cursors),
          apply: (tr, decos) => {
            const meta = tr.getMeta(pluginKey)
            if (meta && meta.cursors) {
              return createDecorations(tr.doc, meta.cursors)
            }
            if (tr.docChanged) {
              return decos.map(tr.mapping, tr.doc)
            }
            return decos
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})

export default RemoteCursors


