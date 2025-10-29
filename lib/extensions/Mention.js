// Custom Mention extension for TipTap v2
import { Node, mergeAttributes } from '@tiptap/core';

const Mention = Node.create({
  name: 'mention',

  addOptions() {
    return {
      HTMLAttributes: {},
      renderLabel({ node }) {
        return `@${node.attrs.label || node.attrs.id}`;
      },
      suggestion: {
        char: '@',
        pluginKey: 'mention',
        command: ({ range, props, query }) => {
          const { editor } = range;
          const mentionNode = editor.schema.nodes.mention.create({
            id: props.id,
            label: props.label,
          });
          editor.chain().focus().insertContentAt(range, mentionNode).run();
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const type = state.schema.nodes[this.name];
          return !!$from.parent.type.contentMatch.matchType(type);
        },
      },
    };
  },

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      label: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': this.name },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          'data-id': node.attrs.id,
        }
      ),
      this.options.renderLabel({ node }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const span = document.createElement('span');
      span.className = 'mention';
      span.setAttribute('data-type', this.name);
      span.setAttribute('data-id', node.attrs.id);
      span.textContent = this.options.renderLabel({ node });
      return {
        dom: span,
      };
    };
  },

  addCommands() {
    return {
      insertMention: (attrs) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs,
        });
      },
    };
  },
});

export default Mention;

