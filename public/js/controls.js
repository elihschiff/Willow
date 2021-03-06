/**
 * Returns the selected statement.
 */
function getSelectedStatement() {
  return $(
      ".statement"
      + `[branches="${JSON.stringify(selected.branches)}"]`
      + `[offset="${selected.offset}"]`
  );
}

/**
 * Focuses on a statement within a tree, with its position given by branch indices
 * and an offset.
 *
 * @param {Number[]} branches the branch indices
 * @param {Number} offset the offset within the node
 */
function focusStatement(branches, offset) {
  // use setTimeout to focus the element after Vue.js is able to react to any
  // changes
  setTimeout(() => $(
      `.statement[branches="${JSON.stringify(branches)}"][offset="${offset}"]`
  ).focus(), 0);
}

/**
 * Focuses on the first statement in the entire tree.
 */
function focusFirstStatement() {
  setTimeout(() => $(".statement").first().focus(), 0);
}

/**
 * Focuses on the last statement in the entire tree.
 */
function focusLastStatement() {
  setTimeout(() => $(".statement").last().focus(), 0);
}

/**
 * Focuses the statement above the focused statement, or does nothing if no
 * statement is focused.
 */
function moveUp() {
  const el = getSelectedStatement();
  if (el.is(".statement")) {
    const statements = $(".statement");
    // search through all statements on the page except for the first, since we
    // cannot move up from the first one
    for (let i = 1; i < statements.length; ++i) {
      if (statements.get(i) === el[0]) {
        // if this statement matches the focused statement, then focus the
        // statement before this one
        statements.get(i - 1).focus();
        return;
      }
    }
  }
}

/**
 * Focuses the first statement in the branch containing the focused statement, or
 * does nothing if no statement is focused.
 */
function moveUpBranch() {
  const el = getSelectedStatement();
  if (el.is(".statement")) {
    const offset = parseInt(el.attr("offset"));
    if (offset === 0) {
      // if this is the first statement in the branch, then move up normally
      moveUp();
      return;
    }

    // focus the first statement in the branch (offset of zero)
    const branches = JSON.parse(el.attr("branches"));
    focusStatement(branches, 0);
  }
}

/**
 * Focuses the statement below the focused statement, or does nothing if no
 * statement is focused.
 */
function moveDown() {
  const el = getSelectedStatement();
  if (el.is(".statement")) {
    const statements = $(".statement");
    // search through all statements of the page except for the last, since we
    // cannot move down from the last one
    for (let i = 0; i < statements.length - 1; ++i) {
      if (statements.get(i) === el[0]) {
        // if this statement matches the focused statement, then focus the
        // statement after this one
        statements.get(i + 1).focus();
        return;
      }
    }
  }
}

/**
 * Focuses the last statement in the branch containing the focused statement, or
 * does nothing if no statement is focused.
 */
function moveDownBranch() {
  const el = getSelectedStatement();
  if (el.is(".statement")) {
    const branches = JSON.parse(el.attr("branches"));
    const offset = parseInt(el.attr("offset"));

    // get the node representing the branch containing the focused statement
    const node = vm.root.node.child(branches);
    if (offset === node.statements.length - 1) {
      // if this is the last statement in the branch, then move down normally
      moveDown();
      return;
    }

    // focus the last statement in the branch (offset of length - 1)
    focusStatement(branches, node.statements.length - 1);
  }
}

const MAX_HISTORY_LENGTH = 32;
const undoStack = [];
let redoStack = [];

/**
 * Records the current state of the tree in the history.
 */
function recordState() {
  // add a clone of the root node to the undo stack and truncate it if necessary
  undoStack.push(vm.root.node.clone());
  while (undoStack.length > MAX_HISTORY_LENGTH) {
    undoStack.shift();
  }

  // clear the redo stack anytime a new change is made
  redoStack = [];
}

/**
 * Reverts the most recent action in the history.
 */
function undo() {
  if ($(document.activeElement).is(".statement")) {
    // if the focused element is a statement, then use default browser undo
    // behavior
    return true;
  }
  if (undoStack.length === 0) {
    // if the undo stack is empty, do nothing
    return;
  }

  // add a clone of the root node to the redo stack and truncate it if necessary
  redoStack.push(vm.root.node.clone());
  while (redoStack.length > MAX_HISTORY_LENGTH) {
    redoStack.shift();
  }

  // set the tree to the most recent clone in the undo stack
  vm.root.node = undoStack.pop();
}

/**
 * Reapplies the most recent undone action.
 */
function redo() {
  if ($(document.activeElement).is(".statement")) {
    // if the focused element is a statement then use default browser redo
    // behavior
    return true;
  }
  if (redoStack.length === 0) {
    // if the redo stack is empty, do nothing
    return;
  }

  // add a clone of the root node to the undo stack and truncate it if necessary
  undoStack.push(vm.root.node.clone());
  while (undoStack.length > MAX_HISTORY_LENGTH) {
    undoStack.shift();
  }

  // set the tree to the most recent clone in the redo stack
  vm.root.node = redoStack.pop();
}

/**
 * Collapses any branch where even node is correctly decomposed
 */
function autoCollapse(){
  let node_html = $('#tree-container > ul').first();
  autoCollapseNode(vm.root.node, node_html);
}

/**
 * Recursive function to auto collapse a node and its children
 */
function autoCollapseNode(node, node_html){
  for(let i=0;i<node.statements.length;i++){
    if(!node.correctlyDecomposed[i]){
      return false;
    }
  }

  let node_html_children = node_html.children('ul');
  for(let i=0;i<node.children.length;i++){
    if(!autoCollapseNode(node.children[i], $(node_html_children[i]))){
      return false;
    }
  }

  let statement_html = node_html.children('li');
  if(statement_html.children('button').text() !== "►"){
    statement_html.children('button').click();
  }
  return true;
}

/**
 * Adds a blank statement before the focused statement, or to the beginning of the
 * tree if no statement is focused.
 */
function addStatementBefore() {
  const el = getSelectedStatement();
  if (el.is(".statement")) {
    const branches = JSON.parse(el.attr("branches"));
    const offset = parseInt(el.attr("offset"));

    // append and focus a statement before the focused statement (use element
    // attributes to determine position)
    vm.root.node.child(branches).statements.splice(offset, 0, {
      str: "",
      premise: false,
      references: [],
    });
    focusStatement(branches, offset);
  } else {
    // prepend and focus a statement to the root node of the tree
    vm.root.node.statements.unshift({
      str: "",
      premise: false,
      references: [],
    });
    focusFirstStatement();
  }
}

/**
 * Adds a blank statement after the focused statement, or to the end of the tree
 * if no statement is focused.
 */
function addStatementAfter() {
  const el = getSelectedStatement();
  if (el.is(".statement")) {
    const branches = JSON.parse(el.attr("branches"));
    const offset = parseInt(el.attr("offset")) + 1;

    // append and focus a statement after the focused statement (use element
    // attributes to determine position)
    vm.root.node.child(branches).statements.splice(offset, 0, {
      str: "",
      premise: false,
      references: [],
    });
    focusStatement(branches, offset);
  } else {
    // append and focus a statement to the last node of the tree
    vm.root.node.lastLeaf.statements.push({
      str: "",
      premise: false,
      references: [],
    });
    focusLastStatement();
  }
}

/**
 * Deletes the focused statement, or the last statement if no statement is
 * focused.
 */
function deleteStatement() {
  const el = getSelectedStatement();
  if (el.is(".statement")) {
    const branches = JSON.parse(el.attr("branches"));
    const offset = parseInt(el.attr("offset"));

    // get the array of statements for the node containing the focused statement
    const statements = vm.root.node.child(branches).statements;
    if (statements.length <= 1) {
      // do not remove the statement if it is the only statement in the node
      alert("You cannot delete the only statement in a branch.");
      return;
    }

    // remove the statement and focus the one before it
    statements.splice(offset, 1);
    focusStatement(branches, Math.max(0, offset - 1));
  } else {
    // get the array of statements for the last node in the tree
    const statements = vm.root.node.lastLeaf.statements;
    if (statements.length <= 1) {
      // do not remove the last statement if it is the only statement in the node
      alert("You cannot delete the only statement in a branch.");
      return;
    }
    // remove the last statement and focus the one before it (now last)
    statements.pop();
    focusLastStatement();
  }
}

/**
 * Adds a branch to the node containing the focused statement, or to the end of
 * the tree if no statement is focused.
 */
function addBranch() {
  const el = getSelectedStatement();
  if (el.is(".statement")) {
    const branches = JSON.parse(el.attr("branches"));
    const children = vm.root.node.child(branches).children;

    // append a branch to the node containing the focused statement, and focus its
    // first statement
    children.push(new TreeNode([""]));
    focusStatement([...branches, children.length - 1], 0);
  } else {
    // append a branch to the last node of the tree, and focus its first statement
    vm.root.node.lastLeaf.children.push(new TreeNode([""]));
    focusLastStatement();
  }
}

/**
 * Deletes the branch containing the focused statement, or the last branch if no
 * statement is focused.
 */
function deleteBranch() {
  // get the element within the branch to be deleted
  let el = getSelectedStatement();
  if (!el.is(".statement")) {
    el = $(".statement").last();
  }

  // get the branch indices for the element
  const branches = JSON.parse(el.attr("branches"));
  if (branches.length === 0) {
    // do not remove the branch if it is the root branch (has no branch indices)
    alert("You cannot delete the root branch.");
    return;
  }

  const branchIdx = branches.pop();
  const parent = vm.root.node.child(branches);
  // remove the branch from its parent node, and focus the last statement of the
  // parent node (preceding the deleted branch)
  parent.children.splice(branchIdx, 1);
  focusStatement(branches, parent.statements.length - 1);
}

/**
 * Focuses on the parent branch of the one currently focused, or does nothing if
 * no statements are focused.
 */
function endBranch() {
  const el = getSelectedStatement();
  if (el.is(".statement")) {
    // get the parent node with respect to the focused statement
    const branches = JSON.parse(el.attr("branches"));
    if (branches.length === 0) {
      // if the focused statement is within the root branch, do nothing since we
      // cannot "end" the root branch
      return;
    }
    branches.pop();
    const parent = vm.root.node.child(branches);

    // focus the last statement of the parent branch
    focusStatement(branches, parent.statements.length - 1);
  }
}

/**
 * Toggles if the selected statement is a premise or not.
 */
function togglePremise() {
  const el = getSelectedStatement();
  if (el.is(".statement")) {
    const branches = JSON.parse(el.attr("branches"));
    const offset = parseInt(el.attr("offset"));
    
    const statement = root.node.child(branches).statements[offset];
    if (statement.str === "◯" || statement.str === "×") {
      alert("A branch terminator cannot be a premise.");
      return;
    }

    statement.premise = !statement.premise;
  } else {
    alert("You must select a statement before performing this action.");
  }
}

const shortcuts = [
  {
    callback: moveUp,
    key: 38,
  },
  {
    callback: moveUpBranch,
    ctrl: true,
    key: 38,
  },
  {
    callback: moveDown,
    key: 40,
  },
  {
    callback: moveDownBranch,
    ctrl: true,
    key: 40,
  },
  {
    callback: undo,
    ctrl: true,
    key: "Z",
  },
  {
    callback: redo,
    ctrl: true,
    key: "Y",
  },
  {
    callback: addStatementBefore,
    ctrl: true,
    key: "B",
    record: true,
  },
  {
    callback: addStatementAfter,
    ctrl: true,
    key: "A",
    record: true,
  },
  {
    callback: deleteStatement,
    ctrl: true,
    key: "D",
    record: true,
  },
  {
    callback: addBranch,
    ctrl: true,
    shift: true,
    key: "B",
    record: true,
  },
  {
    callback: deleteBranch,
    ctrl: true,
    shift: true,
    key: "D",
    record: true,
  },
  {
    callback: endBranch,
    ctrl: true,
    key: "E",
  },
  {
    callback: togglePremise,
    ctrl: true,
    key: "P",
  },
  {
    callback: autoCollapse,
    ctrl: true,
    key: "L",
  },
];

if (localStorage.getItem("shortcuts") === null) {
  localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
} else {
  const storedShortcuts = JSON.parse(localStorage.getItem("shortcuts"));
  // only copy "ctrl" and "key" properties to maintain the callback
  for (let i = 0; i < storedShortcuts.length; i++) {
    shortcuts[i].ctrl = storedShortcuts[i].ctrl;
    shortcuts[i].key = parseInt(shortcuts[i].key)
        ? parseInt(shortcuts[i].key)
        : shortcuts[i].key;
  }
}

document.onkeydown = function(event) {
  for (const shortcut of shortcuts) {
    // get the key code for this shortcut (a string or integer may be provided)
    let key = shortcut.key;
    if (typeof key === "string" || key instanceof String) {
      key = key.charCodeAt(0);
    }

    // ctrl and shift are false by default
    if ((shortcut.ctrl || false) === event.ctrlKey &&
        (shortcut.shift || false) === event.shiftKey &&
        key === event.which) {
      if (shortcut.record) {
        // if this shortcut should record the state of the tree, then record its
        // state before the callback is executed
        recordState();
      }

      // execute the callback
      if (!shortcut.callback(event)) {
        // if the callback does not return true, then stop default browser
        // behavior
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }
}
