import {migrateDiffs, migrateMarks, schema as pubSchema} from './proseEditor/schema';

import ElementSchema from './proseEditor/elementSchema';

class RichEditor {

  constructor({place, contents}) {
    const plugins = [pubpubSetup({schema: pubSchema})];
    this.create({place, contents, plugins});
  }

  create({place, contents, plugins}) {
    const {pubpubSetup, buildMenuItems} = require('./proseEditor/pubpubSetup');
    const {EditorState} = require('prosemirror-state');
    const {MenuBarEditorView, MenuItem} = require('prosemirror-menu');
    const collabEditing = require('prosemirror-collab').collab;
    const {clipboardParser, clipboardSerializer} = require('./proseEditor/clipboardSerializer');


    const menu = buildMenuItems(pubSchema);
    // TO-DO: USE UNIQUE ID FOR USER AND VERSION NUMBER

    migrateMarks(contents);

    ElementSchema.initiateProseMirror({
    	changeNode: this.changeNode,
    	setEmbedAttribute: this.setEmbedAttribute,
    	getState: this.getState,
    });

    this.plugins = plugins;

    const state = EditorState.create({
    	doc: pubSchema.nodeFromJSON(contents),
    	plugins: plugins,
    });

     this.view = new MenuBarEditorView(place, {
      state: state,
      onAction: this._onAction,
    	onUnmountDOM: (view, node) => {
    		// console.log('unmountinggg', node);
    		return;
    		if (node.type && node.type.name === 'embed' || node.type.name === 'block_embed') {
    			ElementSchema.unmountNode(node);
    		}
    	},
    	handleDOMEvent: this._handleDOMEvent,
      menuContent: menu.fullMenu,
    	spellcheck: true,
    	clipboardParser: clipboardParser,
    	clipboardSerializer: clipboardSerializer,
    });
  }

  _handleDOMEvent = (_view, evt) => {
    // console.log(evt, ElementSchema.currentlyEditing(), evt2);
    // return;
    if (ElementSchema.currentlyEditing()) {
      const eventType = evt.type;
      // && eventType.indexOf('drag') === -1
      if (evt.target && evt.target.className && evt.target.className.indexOf('caption') !== -1 && !evt.dataTransfer) {
        if (eventType === 'mousedown') {
          return true;
        }
        return false;
      }
      if (eventType === 'mousedown') {
        if (ElementSchema.checkPoint(evt.target)) {
          return false;
        }
      }
      if (eventType === 'keydown' && (evt.key === 'Delete' || evt.code === 'Backspace')) {
        return false;
      }
      evt.preventDefault();
      return true;
    }
    if (evt.type === 'paste') {
      setTimeout(ElementSchema.countNodes, 200);
    }
    return false;
  }


  _onAction = (action) => {
    // console.log(action);
    const newState = this.view.editor.state.applyAction(action);
    this.view.updateState(newState);
    if (action.type === "selection") {
      ElementSchema.onNodeSelect(newState, action.selection);
    }
  }

	changeNode = (currentFrom, nodeType, nodeAttrs) => {
		const state = this.pm;
		const transform = state.tr.setNodeType(currentFrom, nodeType, nodeAttrs);
		const action = transform.action();
		this.applyAction(action);
	}

	getState = () => {
		return this.view.state;
	}

	applyAction = (action) => {
		const newState = this.view.editor.state.applyAction(action);
		this.view.updateState(newState);
	}

  toJSON = () => {
    return this.view.state.doc.toJSON();
  }

  toMarkdown = () => {
    const {defaultMarkdownSerializer} = require("prosemirror-markdown");
    const markdown = defaultMarkdownSerializer.serialize(this.view.state.doc);
    return markdown;
  }

  setDoc = (newJSONDoc) => {
    const {EditorState} = require('prosemirror-state');
    const newState = EditorState.create({
    	doc: pubSchema.nodeFromJSON(newJSONDoc),
    	plugins: this.plugins,
    });
    this.view.updateState(newState);
  }
}


class CollaborativeRichEditor extends RichEditor {

  constructor({place, contents, collaborative: {userId, versionNumber, lastDiffs, collab}}) {

    const plugins = [pubpubSetup({schema: pubSchema})];
    this.create({place, contents, plugins});
    migrateDiffs(lastDiffs);
    const appliedAction = collab.mod.collab.docChanges.applyAllDiffs(lastDiffs);
    if (appliedAction) {
    		// this.applyAction(appliedAction);
    } else {
    		// indicates that the DOM is broken and cannot be repaired
    		this.collab.mod.serverCommunications.disconnect();
    }

  }

  getStatus = () => {

  }

  onAction = () => {
    // console.log(action);
    const newState = view.editor.state.applyAction(action);
    this.pm = newState;
    view.updateState(newState);
    that.collab.mod.collab.docChanges.sendToCollaborators();
    if (action.type === "selection") {
      ElementSchema.onNodeSelect(newState, action.selection);
    }
  }


}

exports.RichEditor = RichEditor;
exports.CollaborativeRichEditor = CollaborativeRichEditor;
