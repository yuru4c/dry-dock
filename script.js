// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name script.min.js
// ==/ClosureCompiler==

this['DryDock'] = (function ($, Node, Math, JSON) {

var NAME_PREFIX = 'dd-';

function isFunction(object) {
	return typeof object == 'function';
}

function blur() {
	var element = $.activeElement;
	switch (element) {
		case null:
		case $.documentElement:
		case $.body: return;
	}
	element.blur();
}
function createDiv(className) {
	var div = $.createElement('div');
	div.className = NAME_PREFIX + className;
	return div;
}
function toTouch(listener) {
	return function (event) {
		return listener.call(this, event.touches[0]);
	};
}


function _(_) {
	return function (Base) {
		return _(Base, Base.prototype);
	};
}

var inherit = (function (_) {
	return function (constructor, base) {
		_.prototype = base;
		return new _(constructor);
	};
})(function (constructor) {
	this.constructor = constructor;
	constructor.prototype = this;
});


var Vector = (function () {
	
	function Vector(x, y) {
		this._x = x;
		this._y = y;
	}
	var prototype = Vector.prototype;
	
	Vector._ZERO = new Vector(0, 0);
	
	Vector._from = function (event) {
		return new Vector(
			Math.floor(event.clientX),
			Math.floor(event.clientY));
	};
	
	prototype.plus  = function (vector) {
		return new Vector(
			this._x + vector._x,
			this._y + vector._y);
	};
	prototype.minus = function (vector) {
		return new Vector(
			this._x - vector._x,
			this._y - vector._y);
	};
	prototype._of = function (rect) {
		return new Vector(
			this._x - rect._left,
			this._y - rect._top);
	};
	
	prototype._min = function (vector) {
		return new Vector(
			Math.min(this._x, vector._x),
			Math.min(this._y, vector._y));
	};
	prototype._max = function (vector) {
		return new Vector(
			Math.max(this._x, vector._x),
			Math.max(this._y, vector._y));
	};
	
	prototype.square = function () {
		return this._x * this._x +
		       this._y * this._y;
	};
	
	prototype.equals = function (vector) {
		return this._x == vector._x
		    && this._y == vector._y;
	};
	
	return Vector;
})();

var Size = (function () {
	function Size(width, height) {
		this._width  = width;
		this._height = height;
	}
	var prototype = Size.prototype;
	
	Size._from = function (element) {
		return new Size(
			element.clientWidth,
			element.clientHeight);
	};
	
	prototype._max = function (size) {
		return new Size(
			Math.max(this._width,  size._width),
			Math.max(this._height, size._height));
	};
	
	prototype.shrink = function (value) {
		return new Size(
			this._width  - value,
			this._height - value);
	};
	
	return Size;
})();

var Rect = (function () {
	
	function Rect(top, left, width, height) {
		this._top    = top;
		this._left   = left;
		this._width  = width;
		this._height = height;
	}
	var prototype = Rect.prototype;
	
	Rect._from = function (rect) {
		return new Rect(
			rect.top,
			rect.left,
			rect.width,
			rect.height);
	};
	
	prototype.plus = function (vector) {
		return new Rect(
			this._top  + vector._y,
			this._left + vector._x,
			this._width, this._height);
	};
	prototype._of = function (rect) {
		return new Rect(
			this._top  - rect._top,
			this._left - rect._left,
			this._width, this._height);
	};
	
	prototype._max = function (value) {
		return new Rect(
			this._top, this._left,
			Math.max(this._width,  value),
			Math.max(this._height, value));
	};
	prototype._round = function () {
		return new Rect(
			Math.round(this._top),
			Math.round(this._left),
			Math.round(this._width),
			Math.round(this._height));
	};
	
	prototype._right = function () {
		return this._left + this._width;
	};
	prototype._bottom = function () {
		return this._top + this._height;
	};
	
	prototype._contains = function (vector) {
		return this._left <= vector._x && vector._x < this._right()
		    && this._top  <= vector._y && vector._y < this._bottom();
	};
	
	prototype.equals = function (rect) {
		return this._top    == rect._top
		    && this._left   == rect._left
		    && this._width  == rect._width
		    && this._height == rect._height;
	};
	
	prototype.toJSON = function () {
		return {
			'top':    this._top,
			'left':   this._left,
			'width':  this._width,
			'height': this._height
		};
	};
	
	return Rect;
})();


var EdgeDef = (function () {
	
	function EdgeDef(className) {
		this._className = NAME_PREFIX + className;
	}
	
	var VS = [
		EdgeDef.TOP    = new EdgeDef('top'),
		EdgeDef.MIDDLE = new EdgeDef('middle'),
		EdgeDef.BOTTOM = new EdgeDef('bottom')
	];
	var HS = [
		EdgeDef.LEFT   = new EdgeDef('left'),
		EdgeDef.CENTER = new EdgeDef('center'),
		EdgeDef.RIGHT  = new EdgeDef('right')
	];
	
	var NS = 'ns-resize', NESW = 'nesw-resize';
	var EW = 'ew-resize', NWSE = 'nwse-resize';
	var CURSORS = [
		[NWSE,  NS , NESW],
		[ EW , null,  EW ],
		[NESW,  NS , NWSE]
	];
	
	EdgeDef._forEach = function (object) {
		for (var i = 0; i < 3; i++) {
		for (var j = 0; j < 3; j++) {
			object.forEdgeDef(VS[i], HS[j], CURSORS[i][j]);
		}}
	};
	
	return EdgeDef;
})();

var ButtonDef = (function () {
	
	function ButtonDef(letter, horizontal, order) {
		this.letter = letter;
		this._horizontal = horizontal;
		this._order = order;
	}
	var prototype = ButtonDef.prototype;
	
	ButtonDef.TOP    = new ButtonDef('↑', false, false);
	ButtonDef.RIGHT  = new ButtonDef('→', true,  true);
	ButtonDef.BOTTOM = new ButtonDef('↓', false, true);
	ButtonDef.LEFT   = new ButtonDef('←', true,  false);
	ButtonDef.CENTER = new ButtonDef('＋', false, false);
	
	ButtonDef.MAIN_DIV  = 3;
	ButtonDef.OUTER_DIV = 5;
	
	function Diff(i, diff) {
		this._i = i;
		this.diff = diff;
	}
	function Insert(size, tSize, t, n) {
		this._size = size;
		this.tSize = tSize;
		this._t = t;
		this._n = n;
	}
	
	prototype.sizeOf = function (rect) {
		var size = this._horizontal ? rect._width : rect._height;
		return size - Splitter.SIZE;
	};
	
	prototype.calcInsert = function (target) {
		var parent = target._parent;
		var ti = target._index;
		var ni = this._order ? ti + 1 : ti - 1;
		
		var tSize = target._size;
		var nSize = parent._children[ni]._size;
		var sSize = tSize + nSize;
		
		var tcSize = parent._sizes[ti];
		var ncSize = parent._sizes[ni];
		var scSize = tcSize + ncSize;
		
		var icSize = (scSize - Splitter.SIZE) / 3;
		var acSize = icSize + Splitter.SIZE;
		
		return new Insert(icSize, tcSize,
			new Diff(ti, acSize * tSize / sSize),
			new Diff(ni, acSize * nSize / sSize));
	};
	
	return ButtonDef;
})();

var ButtonPos = (function () {
	
	function ButtonPos(rect) {
		this.c = ButtonPos.center(rect);
		this.f = new Vector(
			GuideButton.MARGIN, GuideButton.MARGIN);
		this.l = new Vector(
			rect._width  - GuideButton.DIFF,
			rect._height - GuideButton.DIFF);
	}
	
	ButtonPos.center = function (rect) {
		return new Vector(
			(rect._width  - GuideButton.SIZE) / 2,
			(rect._height - GuideButton.SIZE) / 2);
	};
	
	return ButtonPos;
})();


var Pointer = (function () {
	
	function Pointer(container, event, draggable) {
		this.container = container;
		
		this.point = Vector._from(event);
		this.dragStart = this.point;
		this.dragDiff  = Vector._ZERO;
		this.hardDrag  = draggable.hardDrag;
		this.firstDrag = true;
		
		this.setDragging(draggable);
	}
	var prototype = Pointer.prototype;
	
	var THRESHOLD = 6 * 6; // const
	
	prototype.setDragging = function (draggable) {
		draggable.container = this.container;
		this.dragging = draggable;
	};
	prototype.deleteContainer = function () {
		delete this.dragging.container;
	};
	
	prototype.mousemove = function (event) {
		var point = Vector._from(event);
		if (this.hardDrag) {
			var sq = point.minus(this.dragStart).square();
			if (sq < THRESHOLD) return;
			this.hardDrag = false;
		}
		var diff = point.minus(this.point);
		this.point = point;
		
		if (this.firstDrag) {
			this.dragging.ondragstart();
			this.firstDrag = false;
		}
		var sumDiff = this.dragDiff.plus(diff);
		var resDiff = this.dragging.ondrag(sumDiff);
		this.dragDiff = resDiff ?
			sumDiff.minus(resDiff) : Vector._ZERO;
	};
	prototype.mouseup = function () {
		this.dragging.ondrop();
		this.deleteContainer();
	};
	
	return Pointer;
})();

var Option = (function () {
	
	function Option(value) {
		this._value = value;
	}
	
	Option._get = function (options, key) {
		if (options != null && key in options) {
			return new Option(options[key]);
		}
		return null;
	};
	
	return Option;
})();

var Division = (function () {
	
	function Division(value) {
		this._value = value;
		this.sum   = 0;
		this.rounds = [];
		this._values = [];
	}
	var prototype = Division.prototype;
	
	function Round(index, value) {
		this._index = index;
		this._value = value;
	}
	function compare(a, b) {
		return b._value - a._value || b._index - a._index;
	}
	
	prototype._set = function (i, prop) {
		var value = this._value * prop;
		var floor = Math.floor(value);
		
		this.sum      += floor;
		this._values[i] = floor;
		this.rounds[i] = new Round(i, value - floor);
	};
	prototype._get = function () {
		this.rounds.sort(compare);
		var diff = this._value - this.sum;
		for (var i = 0; i < diff; i++) {
			this._values[this.rounds[i]._index]++;
		}
		return this._values;
	};
	
	return Division;
})();


var Model = (function () {
	
	function Model(className) {
		className = NAME_PREFIX + className;
		this._classList = [className];
		
		this._element = $.createElement(this._tagName);
		this._element.className = className;
		
		this._body = this._element;
	}
	var prototype = Model.prototype;
	
	function indexOf(classList, className) {
		var length = classList.length;
		for (var i = 0; i < length; i++) {
			if (classList[i] == className) return i;
		}
		return -1;
	}
	
	prototype._tagName = 'div';
	
	prototype.setSize = function (width, height) {
		var style = this._element.style;
		style.width  = width  + 'px';
		style.height = height + 'px';
	};
	prototype.unsetSize = function () {
		var style = this._element.style;
		style.width = style.height = '';
	};
	
	prototype.setPos = function (top, left) {
		var style = this._element.style;
		style.top  = top  + 'px';
		style.left = left + 'px';
	};
	
	prototype.setRect = function (rect) {
		this.setPos (rect._top,   rect._left);
		this.setSize(rect._width, rect._height);
	};
	
	prototype.setWidth = function (width) {
		this._element.style.width = width + 'px';
	};
	prototype.setLeft = function (left) {
		this._element.style.left = left + 'px';
	};
	prototype.unsetLeft = function () {
		this._element.style.left = '';
	};
	
	prototype.applyClass = function () {
		this._element.className = this._classList.join(' ');
	};
	prototype.addClass = function (className) {
		if (indexOf(this._classList, className) == -1) {
			this._classList.push(className);
			this.applyClass();
		}
	};
	prototype.removeClass = function (className) {
		var index = indexOf(this._classList, className);
		if (index == -1) return;
		this._classList.splice(index, 1);
		this.applyClass();
	};
	
	return Model;
})();

var Control = _(function (Base, base) {
	
	function Control(className) {
		Base.call(this, className);
	}
	var prototype = inherit(Control, base);
	
	var ACTIVE_NAME = NAME_PREFIX + 'active';
	
	prototype.bodyRect = false;
	prototype._parent = null;
	
	prototype.onActivate = function () { };
	prototype.activate = function () {
		this.onActivate();
		this._parent.activate();
	};
	
	prototype.getRect = function () {
		var element = this.bodyRect ? this._body : this._element;
		return Rect._from(element.getBoundingClientRect());
	};
	
	prototype.addActiveClass = function () {
		this.addClass(ACTIVE_NAME);
	};
	prototype.removeActiveClass = function () {
		this.removeClass(ACTIVE_NAME);
	};
	
	prototype.getContainer = function () {
		return this._parent ? this._parent.getContainer() : null;
	};
	
	return Control;
})(Model);

var Draggable = _(function (Base, base) {
	
	function Draggable(className, parent) {
		Base.call(this, className);
		var self = this;
		
		this._parent = parent;
		
		function mousedown(event) {
			var target = event.target;
			if (target == this || target == self._body) {
				if (event.button) self.activate();
				else {
					self.getContainer().mousedown(event, self);
					self._onmousedown();
				}
				return false;
			}
		}
		this._element.onmousedown  = mousedown;
		this._element.ontouchstart = toTouch(mousedown);
	}
	var prototype = inherit(Draggable, base);
	
	var GRABBING_NAME = NAME_PREFIX + 'grabbing';
	
	prototype.hardDrag = false;
	prototype._cursor = '';
	
	prototype.setCursor = function (cursor) {
		this._cursor = cursor;
		this._element.style.cursor = cursor;
	};
	
	prototype.addGrabbingClass = function () {
		this.addClass(GRABBING_NAME);
	};
	prototype.removeGrabbingClass = function () {
		this.removeClass(GRABBING_NAME);
	};
	
	prototype._onmousedown = function () {
		this.activate();
	};
	prototype.ondragstart = function () { };
	// prototype.ondrag = function (delta) { };
	prototype.ondrop = function () { };
	
	return Draggable;
})(Control);


var Splitter = _(function (Base, base) {
	
	function Splitter(pane, index) {
		Base.call(this, 'splitter', pane);
		
		this._index = index;
		this.setCursor(pane._horizontal ? 'ew-resize' : 'ns-resize');
	}
	var prototype = inherit(Splitter, base);
	
	Splitter.SIZE = 6; // px const
	
	prototype._onmousedown = function () {
		base._onmousedown.call(this);
		this.addGrabbingClass();
	};
	prototype.ondragstart = function () {
		this._parent.onSplitterDragStart(this);
	};
	prototype.ondrag = function (delta) {
		var d = this._parent.onSplitterDrag(this._index,
			this._parent._horizontal ? delta._x : delta._y);
		
		if (d) this.container.layout();
		return this._parent._horizontal ?
			new Vector(d, delta._y) :
			new Vector(delta._x, d);
	};
	prototype.ondrop = function () {
		this._parent.onSplitterDrop();
		this.removeGrabbingClass();
	};
	
	return Splitter;
})(Draggable);

var TabStrip = _(function (Base, base) {
	
	function TabStrip(contents) {
		Base.call(this, 'tabstrip', contents);
		
		this.tabs = [];
	}
	var prototype = inherit(TabStrip, base);
	
	TabStrip.HEIGHT = 26; // px const
	TabStrip.MAIN = TabStrip.HEIGHT + 2; // px const
	
	prototype.hardDrag = true;
	
	prototype.appendTab = function (tab) {
		tab.tabstrip = this;
		this.tabs.push(tab);
		this._body.appendChild(tab._element);
	};
	prototype.insertTab = function (tab, refTab) {
		tab.tabstrip = this;
		this.tabs.splice(refTab._index(), 0, tab);
		this._body.insertBefore(tab._element, refTab._element);
	};
	prototype.removeTab = function (tab) {
		delete tab.tabstrip;
		this.tabs.splice(tab._index(), 1);
		this._body.removeChild(tab._element);
	};
	
	prototype.onTabDrag = function (tab, x) {
		var index = tab._index(), l = this.tabs.length;
		
		var toIndex = index + Math.round(x / this.tabSize);
		if (toIndex <  0) toIndex = 0;
		if (toIndex >= l) toIndex = l - 1;
		if (toIndex == index) return x;
		
		var to = this.tabs[toIndex]._element;
		this.tabs.splice(index, 1);
		this.tabs.splice(toIndex, 0, tab);
		
		this._body.insertBefore(tab._element,
			toIndex < index ? to : to.nextSibling);
		
		this._parent.moveChild(index, toIndex);
		return x - this.tabSize * (toIndex - index);
	};
	
	prototype.ondragstart = function () {
		this._parent.onStripDragStart();
	};
	prototype.ondrag = function (delta) {
		return this._parent.onStripDrag(delta);
	};
	prototype.ondrop = function () {
		this._parent.onStripDrop();
	};
	
	prototype._onresize = function (size, tabSize, margin) {
		var length = this.tabs.length, rem = 0;
		size = margin < size ? size - margin : 0;
		
		if (tabSize * length > size) {
			this.tabSize = size / length;
			if (margin) {
				tabSize = this.tabSize;
			} else {
				tabSize = Math.floor(this.tabSize);
				rem = size % length;
			}
		} else {
			this.tabSize = tabSize;
		}
		this.setEachSize(0, rem, tabSize + 1);
		this.setEachSize(rem, length, tabSize);
	};
	prototype.setEachSize = function (begin, end, size) {
		for (var i = begin; i < end; i++) {
			this.tabs[i].setWidth(size);
		}
	};
	
	return TabStrip;
})(Draggable);

var Tab = _(function (Base, base) {
	
	function Tab(content) {
		Base.call(this, 'tab', content);
		
		var title = content.getTitle();
		this.textNode = $.createTextNode(title);
		
		this._body = $.createElement('span');
		this._body.className = NAME_PREFIX + 'title';
		this._body.appendChild(this.textNode);
		
		var close = new Close(this, content);
		
		this._element.title = title;
		this._element.appendChild(this._body);
		this._element.appendChild(close._element);
	}
	var prototype = inherit(Tab, base);
	
	var FIXED_NAME = NAME_PREFIX + 'fixed';
	
	function Drag(tab) {
		this.contents = tab.tabstrip._parent;
		this.detachable = this.contents instanceof Sub;
		
		if (this.detachable) {
			this.diff = Vector._ZERO;
			this._i = tab._index();
			this._min = -tab.tabstrip.tabSize;
			this._max = this.contents._width +
				this._min * (tab.tabstrip.tabs.length - 1);
		}
		this._x = 0;
	}
	
	prototype.hardDrag = true;
	prototype.tabstrip = null;
	
	prototype._index = function () {
		return this._parent._index;
	};
	
	prototype.setTitle = function (title) {
		this._element.title = title;
		this.textNode.data = title;
	};
	prototype.setFixed = function (fixed) {
		if (fixed) {
			this.addClass(FIXED_NAME);
		} else {
			this.removeClass(FIXED_NAME);
		}
	};
	
	prototype._detach = function (container) {
		var drag = this.drag;
		var contents = drag.contents;
		var rect = contents.getRectOf(container)._round();
		var sub = contents.detachChild(this._parent, drag._i);
		sub.detached = this;
		
		var pointer = container.pointer;
		pointer.deleteContainer();
		pointer.setDragging(sub.tabstrip);
		sub.onStripDragStart();
		return sub.openFloat(container, rect, drag.diff);
	};
	
	prototype.ondragstart = function () {
		this.drag = new Drag(this);
		this.addGrabbingClass();
	};
	prototype.ondrag = function (delta) {
		var drag = this.drag;
		drag._x = this.tabstrip.onTabDrag(this, drag._x + delta._x);
		if (drag.detachable) {
			var diff = drag.diff;
			drag.diff = diff.plus(delta);
			if (drag._x < drag._min || drag._max <= drag._x ||
				Math.abs(drag.diff._y) >= TabStrip.HEIGHT) {
				
				this.removeGrabbingClass();
				this.setLeft(this.tabstrip.tabSize * drag._i);
				return this._detach(this.container).minus(diff);
			}
		}
		this.setLeft(drag._x);
	};
	prototype.ondrop = function () {
		this.removeGrabbingClass();
		this.unsetLeft();
		
		delete this.drag;
	};
	
	return Tab;
})(Draggable);

var Close = _(function (Base, base) {
	
	function Close(tab, content) {
		Base.call(this, 'close', tab);
		
		this._content = content;
		
		this._element.title = '';
		this._body.appendChild($.createTextNode('×'));
	}
	var prototype = inherit(Close, base);
	
	var CANCEL_NAME = NAME_PREFIX + 'cancel';
	
	function Drag(rect) {
		this._rect = rect;
		this.hovering = true;
	}
	
	prototype._tagName = 'a';
	
	prototype._onmousedown = function () {
		this.drag = new Drag(this.getRect());
		this.addActiveClass();
		blur();
	};
	prototype.ondrag = function (delta) {
		var drag = this.drag;
		var point = this.container.pointer.point;
		
		var hovering = drag._rect._contains(point);
		if (hovering != drag.hovering) {
			drag.hovering = hovering;
			if (hovering) {
				this.addActiveClass();
				this.removeClass(CANCEL_NAME);
			} else {
				this.removeActiveClass();
				this.addClass(CANCEL_NAME);
			}
		}
	};
	prototype.ondrop = function () {
		if (this.drag.hovering) {
			this._content['close']();
			this.removeActiveClass();
		} else {
			this.removeClass(CANCEL_NAME);
		}
		delete this.drag;
	};
	
	return Close;
})(Draggable);

var Edge = _(function (Base, base) {
	
	function Edge(frame, v, h, cursor) {
		Base.call(this, 'edge', frame);
		
		this.v = v;
		this.h = h;
		
		this.addClass(v._className);
		this.addClass(h._className);
		this.setCursor(cursor);
	}
	var prototype = inherit(Edge, base);
	
	Edge.SIZE = 2; // px const
	
	prototype.ondrag = function (delta) {
		var dx = delta._x, dy = delta._y;
		
		var rect = this._parent._rect;
		var mw = rect._width  - TabStrip.HEIGHT;
		var mh = rect._height - TabStrip.HEIGHT;
		
		switch (this.v) {
			case EdgeDef.TOP:
			var t = Edge.SIZE - rect._top;
			if (dy > mh) dy = mh;
			if (dy <  t) dy =  t;
			rect._top    += dy;
			rect._height -= dy;
			break;
			
			case EdgeDef.BOTTOM:
			if (dy < -mh) dy = -mh;
			rect._height += dy;
			break;
		}
		switch (this.h) {
			case EdgeDef.LEFT:
			if (dx > mw) dx = mw;
			rect._left  += dx;
			rect._width -= dx;
			break;
			
			case EdgeDef.RIGHT:
			var r = Frame.MIN_R - rect._right();
			if (dx < -mw) dx = -mw;
			if (dx <   r) dx =   r;
			rect._width += dx;
			break;
		}
		this._parent.layout();
		
		return new Vector(dx, dy);
	};
	
	return Edge;
})(Draggable);


var GuideControl = _(function (Base, base) {
	
	function GuideControl(className, container) {
		Base.call(this, className);
		
		this.container = container;
	}
	var prototype = inherit(GuideControl, base);
	
	prototype._hide = function () {
		this._element.style.display = 'none';
	};
	prototype._show = function () {
		this._element.style.display = '';
	};
	
	prototype.setDisable = function (disable) {
		this._disable = disable;
		if (disable) this._hide(); else this._show();
	};
	
	return GuideControl;
})(Model);

var GuideBase = _(function (Base, base) {
	
	function GuideBase(className, container) {
		Base.call(this, className, container);
		
		this.area = new GuideArea(container);
		this._top    = new GuideButton(container, ButtonDef.TOP);
		this._right  = new GuideButton(container, ButtonDef.RIGHT);
		this._bottom = new GuideButton(container, ButtonDef.BOTTOM);
		this._left   = new GuideButton(container, ButtonDef.LEFT);
		
		this._hide();
		this._body.appendChild(this.area._element);
		this._body.appendChild(this._top   ._element);
		this._body.appendChild(this._right ._element);
		this._body.appendChild(this._bottom._element);
		this._body.appendChild(this._left  ._element);
	}
	var prototype = inherit(GuideBase, base);
	
	prototype.droppable = null;
	
	prototype.getButton = function (vector) {
		if (this._top   .hitTest(vector)) return this._top;
		if (this._right .hitTest(vector)) return this._right;
		if (this._bottom.hitTest(vector)) return this._bottom;
		if (this._left  .hitTest(vector)) return this._left;
		return null;
	};
	prototype.setDroppable = function (droppable) {
		if (droppable != this.droppable) {
			if (this.droppable) {
				this.droppable.onleave();
			}
			this.droppable = droppable;
			if (droppable) {
				droppable.onenter();
				this.enter(droppable);
				this.area._show();
			} else {
				this.area._hide();
			}
		}
	};
	
	prototype.onleave = function () {
		this.setDroppable(null);
		this._hide();
	};
	
	prototype.drop = function (contents, target) {
		if (this.droppable) {
			this.droppable.ondrop(contents, target);
		}
		this.onleave();
	};
	prototype.ondrop = function () {
		delete this.droppable;
		delete this.drag;
	};
	
	return GuideBase;
})(GuideControl);

var Guide = _(function (Base, base) {
	
	function Guide(container) {
		Base.call(this, 'guide', container);
		
		this._child = new GuidePane(container);
		this._body.appendChild(this._child._element);
	}
	var prototype = inherit(Guide, base);
	
	function Drag(contents) {
		this.contents = contents;
		this._target = null;
		this.firstDrag = true;
	}
	
	prototype.drag = null;
	
	prototype.ondragstart = function (contents) {
		this.drag = new Drag(contents);
	};
	prototype.ondrag = function () {
		var drag = this.drag;
		if (drag.firstDrag) {
			this.container.calcRect();
			var pos = new ButtonPos(this.container.cRect);
			
			this._top   .setPos(pos.f._y, pos.c._x);
			this._right .setPos(pos.c._y, pos.l._x);
			this._bottom.setPos(pos.l._y, pos.c._x);
			this._left  .setPos(pos.c._y, pos.f._x);
			
			this._show();
			drag.firstDrag = false;
		}
		var point = this.container.pointer.point;
		
		var target = this.container.getChild(point);
		if (target != drag._target) {
			if (drag._target) {
				this._child.setDroppable(null);
			}
			drag._target = target;
			if (target) {
				this._child.onenter(target);
			} else {
				this._child.onleave();
			}
		}
		var relative;
		var top = null;
		if (target) {
			relative = point._of(target.cRect);
			top = this._child.getButton(relative);
		}
		
		var button = top ? null :
			this.getButton(point._of(this.container.cRect));
		this.setDroppable(button);
		
		if (target) {
			this._child.ondrag(relative, top, button);
		}
	};
	
	prototype.enter = function (button) {
		this.area.setOuterArea(button.def, this.container.cRect);
	};
	
	prototype.ondrop = function () {
		var drag = this.drag;
		if (drag) {
			if (drag._target) {
				this._child.drop(drag.contents, drag._target);
			}
			this.drop(drag.contents, this.container);
		}
		base.ondrop.call(this);
		this._child.ondrop();
		this.container.deleteRect();
	};
	
	return Guide;
})(GuideBase);

var GuidePane = _(function (Base, base) {
	
	function GuidePane(container) {
		Base.call(this, 'guidepane', container);
		
		this.center = new GuideButton(container, ButtonDef.CENTER);
		this.guidestrip = new GuideStrip(container);
		this._body.appendChild(this.center._element);
		this._body.appendChild(this.guidestrip._element);
	}
	var prototype = inherit(GuidePane, base);
	
	function Drag(target, container) {
		this._target = target;
		
		this._rect = target.cRect._of(container.cRect);
		this.pane = target._parent instanceof Pane;
		this.main = target instanceof Main;
	}
	
	prototype.onenter = function (target) {
		var drag = new Drag(target, this.container);
		this.drag = drag;
		
		this.setRect(drag._rect);
		
		var c = ButtonPos.center(drag._rect);
		this._top   .setPos(c._y - GuideButton.DIFF, c._x);
		this._right .setPos(c._y, c._x + GuideButton.DIFF);
		this._bottom.setPos(c._y + GuideButton.DIFF, c._x);
		this._left  .setPos(c._y, c._x - GuideButton.DIFF);
		this.center.setPos(c._y, c._x);
		
		var frame = target._parent instanceof Frame;
		this._top   .setDisable(frame);
		this._right .setDisable(frame);
		this._bottom.setDisable(frame);
		this._left  .setDisable(frame);
		this.center.setDisable(drag.main);
		
		this._show();
	};
	prototype.ondrag = function (vector, button, hit) {
		if (button || hit || this.drag.main) {
			this.setDroppable(button);
			return;
		}
		if (vector._y < TabStrip.HEIGHT) {
			this.setDroppable(this.guidestrip);
			this.guidestrip.ondrag(vector);
			return;
		}
		this.setDroppable(null);
	};
	
	prototype.enter = function (droppable) {
		var drag = this.drag;
		var target = drag._target;
		
		if (droppable == this.guidestrip) {
			this.area.setStripArea();
			droppable.enter(target);
			return;
		}
		var def = droppable.def;
		if (drag.main) {
			this.area.setMainArea(def, drag._rect);
			return;
		}
		if (drag.pane && def != ButtonDef.CENTER) {
			var pane = target._parent;
			if (pane._horizontal == def._horizontal) {
				var end = def._order ? pane._children.length - 1 : 0;
				if (target._index != end) {
					this.area.setInsertArea(def, target);
					return;
				}
			}
		}
		this.area.setArea(def, drag._rect);
	};
	
	prototype.getButton = function (vector) {
		var button = base.getButton.call(this, vector);
		if (button) return button;
		if (this.center.hitTest(vector)) return this.center;
		return null;
	};
	
	return GuidePane;
})(GuideBase);


var GuideDroppable = _(function (Base, base) {
	
	function GuideDroppable(className, container) {
		Base.call(this, className, container);
	}
	var prototype = inherit(GuideDroppable, base);
	
	prototype.ondrop = function (contents, target) {
		var parent = target._parent;
		contents._parent._removeChild(contents, true);
		this.drop(contents, target);
		
		target.activate();
		this.container.layout();
		if (parent instanceof Frame) parent.layout();
	};
	
	prototype.sizeOf = function (layout, divisor) {
		var size = this.def.sizeOf(layout.cRect);
		return Math.floor(size / divisor);
	};
	prototype._test = function (layout) {
		return layout instanceof Dock &&
			layout._horizontal == this.def._horizontal;
	};
	prototype.newDock = function (child, pane) {
		var dock = new Dock(this.def._horizontal);
		dock.setChild(child);
		
		var dockpane = this.def._order ? dock.after : dock.before;
		dockpane._appendChild(pane);
		
		return dock;
	};
	
	prototype.outer = function (contents, container, child) {
		contents._size = this.sizeOf(child, ButtonDef.OUTER_DIV);
		if (this._test(child)) {
			if (this.def._order) {
				child.after._appendChild(contents);
			} else {
				child.before.prependChild(contents);
			}
		} else {
			container._removeChild();
			container.setChild(this.newDock(child, contents));
		}
	};
	prototype.dockPane = function (contents, target, parent) {
		contents._size = this.sizeOf(target, ButtonDef.MAIN_DIV);
		if (this._test(parent)) {
			if (this.def._order) {
				parent.after.prependChild(contents);
			} else {
				parent.before._appendChild(contents);
			}
		} else {
			parent._removeChild();
			parent.setChild(this.newDock(target, contents));
		}
	};
	
	prototype.newPane = function (contents, target, parent) {
		var ref = parent._children[target._index + 1];
		parent._removeChild(target, true);
		
		var pane = new Pane(this.def._horizontal);
		pane._size = target._size;
		contents._size = target._size = .5;
		
		if (this.def._order) {
			pane._appendChild(target);
			pane._appendChild(contents);
		} else {
			pane._appendChild(contents);
			pane._appendChild(target);
		}
		parent.insertChild(pane, ref);
	};
	prototype.splitPane = function (contents, target, parent) {
		var size = parent._sizes[target._index];
		parent.remSize -= Splitter.SIZE;
		parent.calcSizes();
		
		var half = (size - Splitter.SIZE) / (parent.remSize * 2);
		contents._size = half;
		target  ._size = half;
		
		parent.insertChild(contents, this.def._order ?
			parent._children[target._index + 1] : target);
	};
	prototype.insertPane = function (contents, target, parent) {
		var ins = this.def.calcInsert(target);
		var i = this.def._order ? ins._n._i : ins._t._i;
		
		parent._sizes[ins._t._i] -= ins._t.diff;
		parent._sizes[ins._n._i] -= ins._n.diff;
		parent._sizes.splice(i, 0, ins._size);
		
		parent.insertChild(contents, this.def._order ?
			parent._children[ins._t._i + 1] : target);
		
		parent.remSize -= Splitter.SIZE;
		parent.calcSizes();
	};
	
	prototype.mergeTabs = function (contents, target, index) {
		var refChild = target._children[index];
		var children = contents._children;
		var length = children.length;
		for (var i = 0; i < length; i++) {
			target.insertChild(children[i], refChild);
		}
		target.activateChild(contents._active);
	};
	
	return GuideDroppable;
})(GuideControl);

var GuideButton = _(function (Base, base) {
	
	function GuideButton(container, def) {
		Base.call(this, 'guidebutton', container);
		
		this.def = def;
		this._body.appendChild($.createTextNode(def.letter));
	}
	var prototype = inherit(GuideButton, base);
	
	GuideButton.SIZE   = 40; // px const
	GuideButton.MARGIN =  3; // px const
	GuideButton.DIFF = GuideButton.SIZE + GuideButton.MARGIN;
	
	var HOVER_NAME = NAME_PREFIX + 'hover';
	
	prototype.setPos = function (top, left) {
		this._rect = new Rect(top, left,
			GuideButton.SIZE, GuideButton.SIZE);
		base.setPos.call(this, top, left);
	};
	
	prototype.hitTest = function (vector) {
		if (this._disable) return false;
		return this._rect._contains(vector);
	};
	
	prototype.onenter = function () {
		this.addClass(HOVER_NAME);
	};
	prototype.onleave = function () {
		this.removeClass(HOVER_NAME);
	};
	
	prototype.drop = function (contents, target) {
		var parent = target._parent;
		if (this.def == ButtonDef.CENTER) {
			this.mergeTabs(contents, target, -1);
			return;
		}
		if (target == this.container) {
			this.outer(contents, target, target._child);
			this.container.updateMinSize();
			return;
		}
		if (target instanceof Main) {
			this.dockPane(contents, target, parent);
			this.container.updateMinSize();
			return;
		}
		if (parent instanceof Pane &&
			parent._horizontal == this.def._horizontal) {
			
			var end = this.def._order ? parent._children.length - 1 : 0;
			if (target._index == end) {
				this.splitPane(contents, target, parent);
			} else {
				this.insertPane(contents, target, parent);
			}
		} else {
			this.newPane(contents, target, parent);
		}
	};
	
	return GuideButton;
})(GuideDroppable);

var GuideStrip = _(function (Base, base) {
	
	function GuideStrip(container) {
		Base.call(this, 'guidestrip', container);
		
		this.area = new GuideArea(container);
		this._body.appendChild(this.area._element);
	}
	var prototype = inherit(GuideStrip, base);
	
	function Drag(target) {
		this._index = -1;
		this.tabSize = target.tabstrip.tabSize;
		this._length  = target._children.length;
	}
	
	prototype.enter = function (target) {
		this.drag = new Drag(target);
	};
	
	prototype.onenter = function () {
		this.area._show();
	};
	prototype.onleave = function () {
		this.area._hide();
	};
	prototype.ondrag = function (vector) {
		var drag = this.drag;
		var index = Math.floor(vector._x / drag.tabSize);
		if (index > drag._length) index = drag._length;
		if (index != drag._index) {
			drag._index = index;
			this.area.setTabArea(index, drag.tabSize);
		}
	};
	
	prototype.drop = function (contents, target) {
		this.mergeTabs(contents, target, this.drag._index);
		delete this.drag;
	};
	
	return GuideStrip;
})(GuideDroppable);

var GuideArea = _(function (Base, base) {
	
	function GuideArea(container) {
		Base.call(this, 'guidearea', container);
		
		this._hide();
	}
	var prototype = inherit(GuideArea, base);
	
	var HEIGHT_PX = TabStrip.HEIGHT + 'px';
	
	prototype._set = function (def, margin, value) {
		var px = value + Splitter.SIZE + 'px';
		var s = this._element.style;
		s.top = s.right = s.bottom = s.left = margin;
		switch (def) {
			case ButtonDef.TOP: s.bottom = px; break;
			case ButtonDef.RIGHT: s.left = px; break;
			case ButtonDef.BOTTOM: s.top = px; break;
			case ButtonDef.LEFT: s.right = px; break;
		}
	};
	
	prototype.setArea = function (def, rect) {
		this._set(def, '0', def.sizeOf(rect) / 2);
	};
	prototype.setMainArea = function (def, rect) {
		var size = def.sizeOf(rect);
		this._set(def, '0', size - size / ButtonDef.MAIN_DIV);
	};
	prototype.setOuterArea = function (def, rect) {
		var size = def.sizeOf(rect) - Container.M2;
		this._set(def, Container.MP,
			size - size / ButtonDef.OUTER_DIV + Container.MARGIN);
	};
	
	prototype.setInsertArea = function (def, target) {
		var ins = def.calcInsert(target);
		this._set(def, '0', ins.tSize - ins._t.diff);
		
		var px = -ins._n.diff + 'px';
		var s = this._element.style;
		switch (def) {
			case ButtonDef.TOP:    s.top    = px; break;
			case ButtonDef.RIGHT:  s.right  = px; break;
			case ButtonDef.BOTTOM: s.bottom = px; break;
			case ButtonDef.LEFT:   s.left   = px; break;
		}
	};
	
	prototype.setTabArea = function (index, width) {
		this.setLeft(width * index);
		this.setWidth(width);
	};
	prototype.setStripArea = function () {
		var s = this._element.style;
		s.top = HEIGHT_PX;
		s.right = s.bottom = s.left = '0';
	};
	
	return GuideArea;
})(GuideControl);


var Layout = _(function (Base, base) {
	
	function Layout(className) {
		Base.call(this, className);
	}
	var prototype = inherit(Layout, base);
	
	var HORIZONTAL_NAME = NAME_PREFIX + 'horizontal';
	
	prototype.getRectOf = function (layout) {
		return this.getRect()._of(layout.getRect());
	};
	
	prototype.addHorizontalClass = function () {
		this.addClass(HORIZONTAL_NAME);
	};
	
	prototype.toJSON = function () {
		return {};
	};
	
	return Layout;
})(Control);

var Single = _(function (Base, base) {
	
	function Single(className) {
		Base.call(this, className);
		
		this._child = null;
	}
	var prototype = inherit(Single, base);
	
	prototype.setChild = function (child) {
		this._child = child;
		child._parent = this;
		this._body.appendChild(child._element);
	};
	prototype._removeChild = function () {
		delete this._child._parent;
		this._body.removeChild(this._child._element);
		this._child = null;
	};
	
	prototype.calcRect = function () {
		this.cRect = this.getRect();
		this._child.calcRect();
	};
	prototype.deleteRect = function () {
		delete this.cRect;
		this._child.deleteRect();
	};
	
	prototype.deactivateAll = function () {
		this._child.deactivateAll();
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['child'] = this._child;
		return json;
	};
	
	return Single;
})(Layout);

var Multiple = _(function (Base, base) {
	
	function Multiple(className) {
		Base.call(this, className);
		
		this._children = [];
	}
	var prototype = inherit(Multiple, base);
	
	prototype._appendChild = function (child) {
		child._parent = this;
		child._index = this._children.length;
		this._children.push(child);
		
		this._body.appendChild(child._element);
	};
	prototype._removeChild = function (child) {
		delete child._parent;
		this._children.splice(child._index, 1);
		var length = this._children.length;
		for (var i = child._index; i < length; i++) {
			this._children[i]._index = i;
		}
		this._body.removeChild(child._element);
	};
	prototype.insertChild = function (child, refChild) {
		child._parent = this;
		this._children.splice(refChild._index, 0, child);
		var length = this._children.length;
		for (var i = refChild._index; i < length; i++) {
			this._children[i]._index = i;
		}
		this._body.insertBefore(child._element, refChild._element);
	};
	
	prototype.calcRect = function () {
		this.cRect = this.getRect();
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i].calcRect();
		}
	};
	prototype.getChild = function (cPoint) {
		if (this.cRect._contains(cPoint)) {
			var length = this._children.length;
			for (var i = 0; i < length; i++) {
				var child = this._children[i].getChild(cPoint);
				if (child) return child;
			}
		}
		return null;
	};
	prototype.deleteRect = function () {
		delete this.cRect;
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i].deleteRect();
		}
	};
	
	prototype.deactivateAll = function () {
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i].deactivateAll();
		}
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['children'] = this._children;
		return json;
	};
	
	return Multiple;
})(Layout);

var Activator = _(function (Base, base) {
	
	function Activator(className) {
		Base.call(this, className);
		
		this._active = null;
	}
	var prototype = inherit(Activator, base);
	
	prototype._removeChild = function (child) {
		base._removeChild.call(this, child);
		
		if (child == this._active) {
			var length = this._children.length;
			if (length) {
				var index = child._index;
				if (index == length) index = length - 1;
				this.activateChild(this._children[index]);
			} else {
				this._active = null;
			}
		}
	};
	
	prototype.activateChild = function (child) {
		if (child == this._active) return;
		if (this._active) this._active.deactivation();
		this._active = child;
		child.activation();
	};
	
	return Activator;
})(Multiple);


var DockBase = _(function (Base, base) {
	
	function DockBase(className) {
		Base.call(this, className);
	}
	var prototype = inherit(DockBase, base);
	
	prototype.getMain = function () {
		return this._child.getMain();
	};
	
	prototype.fromJSON = function (container, json) {
		var child = json['child'];
		switch (child['type']) {
			case Dock.TYPE:
			this.setChild(Dock.fromJSON(container, child));
			break;
			
			case Main.TYPE:
			this.setChild(Main.fromJSON(container, child));
			break;
		}
	};
	
	return DockBase;
})(Single);

var Container = _(function (Base, base) {
	
	var DRAGGING_NAME = NAME_PREFIX + 'dragging';
	var FLOATING_NAME = NAME_PREFIX + 'floating';
	
	function Container(element) {
		Base.call(this, 'container');
		var self = this;
		
		this.contents = {};
		for (var node = element.firstChild; node; ) {
			var next = node.nextSibling;
			element.removeChild(node);
			if (node.nodeType == Node.ELEMENT_NODE) {
				var id = node.id;
				if (id) {
					var o = new Option(id);
					this.contents[id] = new Content(node, o);
				}
			}
			node = next;
		}
		
		// DOM
		this._body    = createDiv('body');
		this.overlay = createDiv('overlay');
		this.floats = new Floats(this);
		this.guide  = new Guide(this);
		
		this._element.appendChild(this._body);
		this._element.appendChild(this.floats._element);
		this._element.appendChild(this.guide._element);
		this._element.appendChild(this.overlay);
		this._element.onmousedown = function (event) {
			if (event.target == this) {
				self.activate();
				return false;
			}
		};
		element.appendChild(this._element);
		
		this.mousemove = function (event) {
			self.pointer.mousemove(event);
		};
		this.mouseup = function () {
			this.onmousemove = null;
			this.onmouseup   = null;
			this.ontouchmove = null;
			this.ontouchend  = null;
			
			self.pointer.mouseup();
			delete self.pointer;
			
			self.removeClass(DRAGGING_NAME);
		};
		this.touchmove = toTouch(this.mousemove);
		this.touchend  = toTouch(this.mouseup);
	}
	var prototype = inherit(Container, base);
	
	Container.MARGIN = 6; // px const
	Container.M2 = Container.MARGIN * 2;
	Container.MP = Container.MARGIN + 'px';
	
	prototype.minSize = null;
	prototype.cSize   = null;
	
	prototype.mousedown = function (event, draggable) {
		this.pointer = new Pointer(this, event, draggable);
		
		this.overlay.style.cursor = draggable._cursor;
		this.addClass(DRAGGING_NAME);
		
		this._element.onmousemove = this.mousemove;
		this._element.onmouseup   = this.mouseup;
		this._element.ontouchmove = this.touchmove;
		this._element.ontouchend  = this.touchend;
	};
	
	prototype.calcRect = function () {
		base.calcRect.call(this);
		this.floats.calcRect();
	};
	prototype.getChild = function (cPoint) {
		if (this.cRect._contains(cPoint)) {
			var child = this.floats.getChild(cPoint);
			if (child) {
				if (child instanceof Frame) return null;
				return child;
			}
			return this._child.getChild(cPoint);
		}
		return null;
	};
	prototype.deleteRect = function () {
		base.deleteRect.call(this);
		this.floats.deleteRect();
	};
	
	prototype.activateFloats = function () {
		this.addClass(FLOATING_NAME);
		blur();
	};
	prototype.activate = function () { // stop bubbling
		this.removeClass(FLOATING_NAME);
		blur();
	};
	
	prototype.deactivateAll = function () {
		base.deactivateAll.call(this);
		this.floats.deactivateAll();
	};
	
	prototype.onresize = function () {
		this.cSize = Size._from(this._element);
		if (this.minSize) {
			this.updateSize();
		} else {
			this.updateMinSize();
		}
		this.layout();
	};
	prototype.updateMinSize = function () {
		this.minSize = this._child.getMinSize();
		this.updateSize();
	};
	prototype.updateSize = function () {
		this._size = this.cSize
			.shrink(Container.M2)._max(this.minSize);
	};
	prototype.layout = function () {
		this._child._onresize(this._size._width, this._size._height);
	};
	
	prototype.getContainer = function () {
		return this;
	};
	
	prototype.init = function () {
		if (this._child) {
			this.deactivateAll();
			this._removeChild();
			this.minSize = null;
		}
		this.floats.removeAll();
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['floats'] = this.floats;
		return json;
	};
	prototype.fromJSON = function (json) {
		base.fromJSON.call(this, this, json);
		this.floats.fromJSON(this, json['floats']);
	};
	
	return Container;
})(DockBase);

var Floats = _(function (Base, base) {
	
	function Floats(container) {
		Base.call(this, 'floats');
		
		this._parent = container;
	}
	var prototype = inherit(Floats, base);
	
	prototype._appendChild = function (frame) {
		frame.setZ(this._children.length);
		base._appendChild.call(this, frame);
		frame.layout();
	};
	prototype._removeChild = function (frame, pauseLayout) {
		base._removeChild.call(this, frame);
		if (pauseLayout) return;
		
		var length = this._children.length;
		for (var i = frame._index; i < length; i++) {
			this._children[i].setZ(i);
		}
		
		if (length) return;
		this._parent.activate();
	};
	prototype.removeAll = function () {
		for (var i = this._children.length - 1; i >= 0; i--) {
			this._removeChild(this._children[i], true);
		}
	};
	
	prototype.calcRect = function () {
		var length = this._children.length - 1;
		for (var i = 0; i < length; i++) {
			this._children[i].calcRect();
		}
	};
	prototype.getChild = function (cPoint) {
		for (var i = this._children.length - 2; i >= 0; i--) {
			var child = this._children[i].getChild(cPoint);
			if (child) return child;
		}
		return null;
	};
	prototype.deleteRect = function () {
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i].deleteRect();
		}
	};
	
	prototype.activateChild = function (frame) {
		base.activateChild.call(this, frame);
		
		this._children.splice(frame._index, 1);
		this._children.push(frame);
		
		var length = this._children.length;
		for (var i = frame._index; i < length; i++) {
			var child = this._children[i];
			child._index = i;
			child.setZ(i);
		}
	};
	
	prototype.activate = function () { // stop bubbling
		this._parent.activateFloats();
	};
	
	prototype.fromJSON = function (container, json) {
		var length = json['children'].length;
		for (var i = 0; i < length; i++) {
			var child = json['children'][i];
			var frame = Frame.fromJSON(container, child);
			this._appendChild(frame);
		}
	};
	
	return Floats;
})(Activator);

var Frame = _(function (Base, base) {
	
	function Frame(sub) {
		Base.call(this, 'frame');
		
		// DOM
		this._body = createDiv('fbody');
		this.setChild(sub);
		
		this._element.appendChild(this._body);
		EdgeDef._forEach(this);
	}
	var prototype = inherit(Frame, base);
	
	Frame.MIN_R = Edge.SIZE + TabStrip.HEIGHT;
	
	Frame.fromJSON = function (container, json) {
		var sub = Sub.fromJSON(container, json['child']);
		var frame = new Frame(sub);
		frame._rect = Rect._from(json['rect']);
		return frame;
	};
	
	var HANDLE = 6; // px const
	var H2 = HANDLE * 2;
	
	prototype.bodyRect = true;
	
	prototype.forEdgeDef = function (v, h, cursor) {
		if (cursor) {
			var edge = new Edge(this, v, h, cursor);
			this._element.appendChild(edge._element);
		}
	};
	
	prototype.setZ = function (zIndex) {
		this._element.style.zIndex = zIndex;
	};
	
	prototype._removeChild = function (sub, pauseLayout) {
		this._parent._removeChild(this, pauseLayout);
	};
	
	prototype.getChild = function (cPoint) {
		if (this.cRect._contains(cPoint)) {
			return this._child.getChild(cPoint) || this;
		}
		return null;
	};
	
	prototype.onActivate = function () {
		this._parent.activateChild(this);
	};
	prototype.activation = function () {
		this.addActiveClass();
	};
	prototype.deactivation = function () {
		this.removeActiveClass();
	};
	
	prototype.layout = function () {
		this.setRect(this._rect);
		this._child.layout(this._rect._width);
	};
	prototype._move = function (vector) {
		this._rect = this._rect.plus(vector);
		this.setPos(this._rect._top, this._rect._left);
	};
	
	prototype.setSize = function (width, height) {
		base.setSize.call(this,
			width  + H2,
			height + H2);
	};
	prototype.setPos = function (top, left) {
		base.setPos.call(this,
			top  - HANDLE,
			left - HANDLE);
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['rect'] = this._rect;
		return json;
	};
	
	return Frame;
})(Single);

var Dock = _(function (Base, base) {
	
	function Dock(horizontal) {
		Base.call(this, 'dock');
		
		this._horizontal = horizontal;
		this.before = new DockPane(this, false);
		this.after  = new DockPane(this, true);
		
		// DOM
		if (horizontal) this.addHorizontalClass();
		this._body.appendChild(this.before._element);
		this._body.appendChild(this.after ._element);
	}
	var prototype = inherit(Dock, base);
	
	Dock.TYPE = 'dock';
	
	Dock.fromJSON = function (container, json) {
		var dock = new Dock(json['horizontal']);
		dock.fromJSON(container, json);
		dock.before.fromJSON(container, json['before']);
		dock.after .fromJSON(container, json['after']);
		return dock;
	};
	
	prototype.onRemove = function () {
		if (this.before._children.length) return;
		if (this.after ._children.length) return;
		
		var parent = this._parent;
		parent._removeChild();
		if (parent     instanceof Dock &&
		    this._child instanceof Dock) {
			
			parent.setChild(this._child._child);
			parent.before.merge(this._child.before);
			parent.after .merge(this._child.after);
		} else {
			parent.setChild(this._child);
		}
	};
	
	prototype.setChild = function (child) {
		this._child = child;
		child._parent = this;
		this._body.insertBefore(child._element, this.after._element);
	};
	
	prototype.calcRect = function () {
		base.calcRect.call(this);
		this.before.calcRect();
		this.after .calcRect();
	};
	prototype.getChild = function (cPoint) {
		if (this.cRect._contains(cPoint)) {
			return this._child .getChild(cPoint)
			    || this.before.getChild(cPoint)
			    || this.after .getChild(cPoint);
		}
		return null;
	};
	prototype.deleteRect = function () {
		base.deleteRect.call(this);
		this.before.deleteRect();
		this.after .deleteRect();
	};
	
	prototype.deactivateAll = function () {
		base.deactivateAll.call(this);
		this.before.deactivateAll();
		this.after .deactivateAll();
	};
	
	prototype.getMinSize = function () {
		var size = this._child.getMinSize();
		var sum = this.before._size + this.after._size;
		return this._horizontal ?
			new Size(size._width + sum, size._height) :
			new Size(size._width, size._height + sum);
	};
	
	prototype._onresize = function (width, height) {
		this.setSize(width, height);
		var sum = this.before._size + this.after._size;
		if (this._horizontal) {
			this.before._onresize(this.before._size, height);
			this._child ._onresize(width - sum,      height);
			this.after ._onresize(this.after._size,  height);
		} else {
			this.before._onresize(width, this.before._size);
			this._child ._onresize(width, height - sum);
			this.after ._onresize(width, this.after._size);
		}
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['before'] = this.before;
		json['after']  = this.after;
		json['horizontal'] = this._horizontal;
		json['type'] = Dock.TYPE;
		return json;
	};
	
	return Dock;
})(DockBase);


var PaneBase = _(function (Base, base) {
	
	function PaneBase(className, horizontal) {
		Base.call(this, className);
		
		this._horizontal = horizontal;
		this.splitters = [];
		
		// DOM
		if (horizontal) this.addHorizontalClass();
	}
	var prototype = inherit(PaneBase, base);
	
	prototype.drag = null;
	
	prototype.onSplitterDrop = function () {
		delete this.drag;
	};
	
	prototype.appendSplitter = function () {
		var splitter = new Splitter(this, this.splitters.length);
		this.splitters.push(splitter);
		this._body.appendChild(splitter._element);
	};
	prototype.removeSplitter = function (i) {
		var splitter = this.splitters[i];
		this.splitters.splice(i, 1);
		for (var l = this.splitters.length; i < l; i++) {
			this.splitters[i]._index = i;
		}
		this._body.removeChild(splitter._element);
	};
	prototype.insertSplitter = function (i, refElement) {
		var splitter = new Splitter(this, i);
		this.splitters.splice(i, 0, splitter);
		for (var l = this.splitters.length; i < l; i++) {
			this.splitters[i]._index = i;
		}
		this._body.insertBefore(splitter._element, refElement);
	};
	
	prototype._replaceChild = function (child, oldChild) {
		delete oldChild._parent;
		child._parent = this;
		this._children.splice(oldChild._index, 1, child);
		child._index = oldChild._index;
		
		this._body.replaceChild(child._element, oldChild._element);
	};
	
	prototype.fromJSON = function (container, json) {
		var length = json['children'].length;
		for (var i = 0; i < length; i++) {
			var child = json['children'][i];
			var layout;
			switch (child['type']) {
				case Pane.TYPE:
				layout = Pane.fromJSON(container, child);
				break;
				
				case Sub.TYPE:
				layout = Sub.fromJSON(container, child);
				break;
			}
			layout._size = child['size'];
			this._appendChild(layout);
		}
	};
	
	return PaneBase;
})(Multiple);

var DockPane = _(function (Base, base) {
	
	function DockPane(dock, order) {
		Base.call(this, 'dockpane', dock._horizontal);
		this._parent = dock;
		
		this._size = 0;
		this._order = order;
	}
	var prototype = inherit(DockPane, base);
	
	function Drag(dockpane, container) {
		this.container = container;
		
		var size = container._size;
		var min  = container.minSize;
		var rem = dockpane._horizontal ?
			size._width  - min._width :
			size._height - min._height;
		
		this.maxSize = dockpane._size + rem;
	}
	
	prototype.onSplitterDragStart = function (splitter) {
		var inner = this._order ? 0 : this._children.length - 1;
		if (splitter._index == inner) {
			this.drag = new Drag(this, splitter.container);
		}
	};
	prototype.onSplitterDrag = function (i, delta) {
		var child = this._children[i];
		if (this._order) delta = -delta;
		
		if (delta < -child._size) delta = -child._size;
		var drag = this.drag;
		if (drag) {
			if (delta < -this._size) delta = this._size;
			var rem = drag.maxSize - this._size;
			if (rem < delta) delta = rem;
			this._size  += delta;
			child._size += delta;
			
			drag.container.updateMinSize();
		} else {
			var next = this._children[this._order ? i - 1 : i + 1];
			if (delta > next._size) delta = next._size;
			child._size += delta;
			next ._size -= delta;
		}
		return this._order ? -delta : delta;
	};
	
	prototype.merge = function (dockpane) {
		var children = dockpane._children;
		var i, length = children.length;
		if (this._order) {
			for (i = length - 1; i >= 0; i--) {
				this.prependChild(children[i]);
			}
		} else {
			for (i = 0; i < length; i++) {
				this._appendChild(children[i]);
			}
		}
	};
	
	prototype._expand = function (child) {
		this._size += child._size + Splitter.SIZE;
	};
	prototype._appendChild = function (child) {
		this._expand(child);
		if (this._order) {
			this.appendSplitter();
			base._appendChild.call(this, child);
		} else {
			base._appendChild.call(this, child);
			this.appendSplitter();
		}
	};
	prototype._removeChild = function (child, pauseLayout) {
		this._size -= child._size + Splitter.SIZE;
		base._removeChild.call(this, child);
		this.removeSplitter(child._index);
		
		if (pauseLayout) return;
		
		this.getContainer().updateMinSize();
		this._parent.onRemove();
	};
	prototype.insertChild = function (child, refChild) {
		if (refChild == null) {
			this._appendChild(child);
			return;
		}
		this._expand(child);
		base.insertChild.call(this, child, refChild);
		this.insertSplitter(
			child._index + this._order, refChild._element);
	};
	prototype.prependChild = function (child) {
		this.insertChild(child, this._children[0]);
	};
	
	prototype._onresize = function (width, height) {
		this.setSize(width, height);
		var i, length = this._children.length;
		var child;
		if (this._horizontal) {
			for (i = 0; i < length; i++) {
				child = this._children[i];
				child._onresize(child._size, height);
			}
		} else {
			for (i = 0; i < length; i++) {
				child = this._children[i];
				child._onresize(width, child._size);
			}
		}
	};
	
	return DockPane;
})(PaneBase);

var Pane = _(function (Base, base) {
	
	function Pane(horizontal) {
		Base.call(this, 'pane', horizontal);
		
		this._collapse = false;
	}
	var prototype = inherit(Pane, base);
	
	Pane.TYPE = 'pane';
	
	Pane.fromJSON = function (container, json) {
		var pane = new Pane(json['horizontal']);
		pane.fromJSON(container, json);
		return pane;
	};
	
	function Drag() { }
	
	var COLLAPSE_NAME = NAME_PREFIX + 'collapse';
	
	prototype.onSplitterDragStart = function (splitter) {
		if (this.remSize) {
			this.calcSizes();
		} else {
			this.drag = new Drag();
		}
	};
	prototype.onSplitterDrag = function (i, delta) {
		if (this.drag) return;
		var n = i + 1;
		
		var iSize = this._sizes[i];
		var nSize = this._sizes[n];
		
		if (delta < -iSize) delta = -iSize;
		if (delta >  nSize) delta =  nSize;
		
		this._children[i]._size = (iSize + delta) / this.remSize;
		this._children[n]._size = (nSize - delta) / this.remSize;
		
		return delta;
	};
	
	prototype.merge = function (pane, ref) {
		var children = pane._children;
		var i, length = children.length;
		var child;
		
		this.remSize -= pane._collapse ?
			this._sizes[ref._index] : Splitter.SIZE * (length - 1);
		if (this.remSize) {
			this.calcSizes();
			var sizes = pane._sizes;
			for (i = 0; i < length; i++) {
				child = children[i];
				child._size = sizes[i] / this.remSize;
				this.insertChild(child, ref);
			}
		} else {
			for (i = 0; i < length; i++) {
				child = children[i];
				child._size *= ref._size;
				this.insertChild(child, ref);
			}
		}
		this._removeChild(ref, true);
	};
	
	prototype._appendChild = function (child) {
		if (this._children.length) this.appendSplitter();
		base._appendChild.call(this, child);
	};
	prototype._removeChild = function (child, pauseLayout) {
		base._removeChild.call(this, child);
		var index = child._index;
		if (this.splitters.length) {
			this.removeSplitter(index ? index - 1 : index);
		}
		if (pauseLayout) return;
		
		var l = this._children.length;
		if (l == 1) {
			var remChild = this._children[0];
			if (remChild    instanceof Pane &&
			    this._parent instanceof Pane) {
				
				this._parent.merge(remChild, this);
			} else {
				remChild._size = this._size;
				this._parent._replaceChild(remChild, this);
			}
			return;
		}
		if (l) {
			var li = index == 0 ? 0 : index - 1;
			var ri = index == l ? l - 1 : index;
			var cl = this._children[li];
			var cr = this._children[ri];
			
			var size = this._collapse ? child._size :
				this._sizes[index] + Splitter.SIZE;
			var ls = cl._size;
			var rs = cr._size;
			var sum = ls + rs;
			if (sum == 0.) { sum = 1.; ls = rs = .5; }
			
			if (this._collapse) {
				cl._size += size * ls / sum;
				cr._size += size * rs / sum;
			} else {
				this.remSize += Splitter.SIZE;
				this._sizes.splice(index, 1);
				this._sizes[li] += size * ls / sum;
				this._sizes[ri] += size * rs / sum;
				this.calcSizes();
			}
		} else {
			this._parent._removeChild(this, false);
		}
	};
	prototype.insertChild = function (child, refChild) {
		if (refChild == null) {
			this._appendChild(child);
			return;
		}
		base.insertChild.call(this, child, refChild);
		this.insertSplitter(child._index, refChild._element);
	};
	
	prototype.calcSizes = function () {
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i]._size = this._sizes[i] / this.remSize;
		}
	};
	
	prototype.divideSizes = function (size) {
		if (size < 0) {
			this.remSize = 0;
			if (!this._collapse) {
				this._collapse = true;
				this.addClass(COLLAPSE_NAME);
			}
		} else {
			this.remSize = size;
			if (this._collapse) {
				this._collapse = false;
				this.removeClass(COLLAPSE_NAME);
			}
		}
		var division = new Division(this.remSize);
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			division._set(i, this._children[i]._size);
		}
		this._sizes = division._get();
	};
	prototype._onresize = function (width, height) {
		this.setSize(width, height);
		var sum = Splitter.SIZE * this.splitters.length;
		var i, length = this._children.length;
		if (this._horizontal) {
			this.divideSizes(width - sum);
			for (i = 0; i < length; i++) {
				this._children[i]._onresize(this._sizes[i], height);
			}
		} else {
			this.divideSizes(height - sum);
			for (i = 0; i < length; i++) {
				this._children[i]._onresize(width, this._sizes[i]);
			}
		}
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['horizontal'] = this._horizontal;
		json['size'] = this._size;
		json['type'] = Pane.TYPE;
		return json;
	};
	
	return Pane;
})(PaneBase);


var Contents = _(function (Base, base) {
	
	function Contents(className) {
		Base.call(this, className);
		var self = this;
		
		this.tabstrip = new TabStrip(this);
		
		// DOM
		var cover = createDiv('cover');
		cover.onmousedown = function () {
			self.activate();
			return false;
		};
		
		this._body = createDiv('contents');
		this._body.appendChild(cover);
		
		this._element.appendChild(this.tabstrip._element);
		this._element.appendChild(this._body);
	}
	var prototype = inherit(Contents, base);
	
	prototype._appendChild = function (content, pauseLayout) {
		base._appendChild.call(this, content);
		this.tabstrip.appendTab(content._tab);
		
		if (pauseLayout) return;
		this.setTabSize();
	};
	prototype.insertChild = function (content, refChild) {
		if (refChild == null) {
			this._appendChild(content, true);
			return;
		}
		this.tabstrip.insertTab(content._tab, refChild._tab);
		base.insertChild.call(this, content, refChild);
	};
	prototype._removeChild = function (content) {
		this.tabstrip.removeTab(content._tab);
		base._removeChild.call(this, content);
		
		if (this._children.length) this.setTabSize();
	};
	
	prototype.moveChild = function (index, to) {
		var child = this._children[index];
		this._children.splice(index, 1);
		this._children.splice(to, 0, child);
		
		if (index > to) {
			var tmp = index; index = to; to = tmp;
		}
		for (var i = index; i <= to; i++) {
			this._children[i]._index = i;
		}
	};
	
	prototype.calcRect = function () {
		this.cRect = this.getRect();
	};
	prototype.getChild = function (cPoint) {
		if (this.cRect._contains(cPoint)) return this;
		return null;
	};
	prototype.deleteRect = function () {
		delete this.cRect;
	};
	
	prototype.deactivateAll = function () {
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i].deactivation();
		}
	};
	
	prototype.onStripDragStart = function () { };
	prototype.onStripDrag = function (delta) { };
	prototype.onStripDrop = function () { };
	
	prototype.fromJSON = function (container, json) {
		var length = json['children'].length;
		for (var i = 0; i < length; i++) {
			var child = json['children'][i];
			var content = Content.fromJSON(container, child);
			this._appendChild(content, true);
		}
		if (length) {
			var active = this._children[json['active']];
			this.activateChild(active);
		}
	};
	
	return Contents;
})(Activator);

var Main = _(function (Base, base) {
	
	function Main() {
		Base.call(this, 'main');
	}
	var prototype = inherit(Main, base);
	
	Main.TYPE = 'main';
	
	Main.fromJSON = function (container, json) {
		var main = new Main();
		main.fromJSON(container, json);
		return main;
	};
	
	var MIN_SIZE = new Size(TabStrip.MAIN, TabStrip.MAIN);
	var TAB_SIZE = 120; // px const
	
	prototype.getMinSize = function () {
		return MIN_SIZE;
	};
	prototype._onresize = function (width, height) {
		this.setSize(width, height);
		this._width = width;
		this.setTabSize();
	};
	prototype.setTabSize = function () {
		this.tabstrip._onresize(this._width, TAB_SIZE, 0);
	};
	
	prototype.getMain = function () {
		return this;
	};
	
	prototype.toJSON = function () {
		var children = []; var active = 0;
		
		if (this._active) {
			var index = this._active._index;
			var length = this._children.length;
			for (var i = 0; i < length; i++) {
				var child = this._children[i];
				if (child.html) {
					children.push(child);
					if (i < index) active++;
				}
			}
		}
		if (active == children.length) {
			active = children.length - 1;
		}
		return {
			'children': children,
			'active': active,
			'type': Main.TYPE
		};
	};
	
	return Main;
})(Contents);

var Sub = _(function (Base, base) {
	
	function Sub() {
		Base.call(this, 'sub');
	}
	var prototype = inherit(Sub, base);
	
	Sub.TYPE = 'sub';
	
	Sub.fromJSON = function (container, json) {
		var sub = new Sub();
		sub.fromJSON(container, json);
		return sub;
	};
	
	var TAB_SIZE = 112; // px const
	
	function max(delta, rect) {
		return delta._max(new Vector(
			Frame.MIN_R - rect._right(),
			Edge.SIZE   - rect._top));
	}
	
	prototype.detached = null;
	
	prototype.detachChild = function (content, i) {
		if (i == this._children.length - 1) {
			if (i == content._index) i--;
		} else {
			if (i >= content._index) i++;
		}
		this._active = null;
		this.activateChild(this._children[i]);
		this._removeChild(content);
		
		var sub = new Sub();
		sub._appendChild(content, true);
		sub.activateChild(content);
		return sub;
	};
	
	prototype.openFloat = function (container, rect, delta) {
		var frame = new Frame(this);
		delta = max(delta, rect);
		frame._rect = rect.plus(delta)._max(TabStrip.HEIGHT);
		
		container.floats._appendChild(frame);
		frame.activate();
		return delta;
	};
	
	prototype.onStripDragStart = function () {
		this.tabstrip.addGrabbingClass();
		this.tabstrip.container.guide.ondragstart(this);
	};
	prototype.onStripDrag = function (delta) {
		var container = this.tabstrip.container;
		
		if (this._parent instanceof Frame) {
			delta = max(delta, this._parent._rect);
			this._parent._move(delta);
			
			container.guide.ondrag();
			return delta;
		}
		
		var rect = this.getRectOf(container)._round();
		this._parent._removeChild(this, false);
		container.layout();
		this.unsetSize();
		return this.openFloat(container, rect, delta);
	};
	prototype.onStripDrop = function () {
		if (this.detached) {
			this.detached.ondrop();
			delete this.detached;
			this.setTabSize();
		}
		this.tabstrip.removeGrabbingClass();
		this.tabstrip.container.guide.ondrop();
	};
	
	prototype._removeChild = function (content) {
		base._removeChild.call(this, content);
		
		if (this._children.length) return;
		var container = this.getContainer();
		this._parent._removeChild(this, false);
		container.layout();
	};
	
	prototype._onresize = function (width, height) {
		this.setSize(width, height);
		this.layout(width);
	};
	prototype.layout = function (width) {
		this._width = width;
		this.setTabSize();
	};
	prototype.setTabSize = function () {
		if (this.detached) return;
		this.tabstrip._onresize(
			this._width, TAB_SIZE, TabStrip.HEIGHT);
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['active'] = this._active._index;
		if (this._parent instanceof PaneBase) {
			json['size'] = this._size;
			json['type'] = Sub.TYPE;
		}
		return json;
	};
	
	return Sub;
})(Contents);


var Content = _(function (Base, base) {
	
	var DATA_PREFIX = 'data-' + NAME_PREFIX;
	var TITLE_NAME = DATA_PREFIX + 'title';
	var FIXED_NAME = DATA_PREFIX + 'fixed';
	
	function Content(iframe, options) {
		Base.call(this, 'content');
		var self = this;
		
		this.iframe = iframe;
		
		this.html = options instanceof Option;
		if (this.html) {
			this.id = options._value;
			options = null;
		}
		
		var t = Option._get(options, 'title');
		this._title = t ? t._value : iframe.getAttribute(TITLE_NAME);
		
		var f = Option._get(options, 'fixed');
		var fixed = f ? f._value : iframe.hasAttribute(FIXED_NAME);
		
		this.hidden = true;
		
		this._tab = new Tab(this);
		this['setFixed'](fixed);
		
		this.isIframe = iframe.tagName == 'IFRAME';
		// DOM
		if (this.isIframe && iframe.onload == null) {
			iframe.onload = function () {
				self.updateTitle();
			};
		}
		this._body.appendChild(iframe);
	}
	var prototype = inherit(Content, base);
	
	Content.fromJSON = function (container, json) {
		return container.contents[json['id']];
	};
	
	prototype.id = null;
	
	prototype['onvisibilitychange'] = null;
	prototype['onclose'] = null;
	
	prototype['setTitle'] = function (title) {
		this._title = title;
		this.updateTitle();
	};
	prototype.getTitle = function () {
		if (this._title) return this._title;
		var title;
		if (this.isIframe) {
			try {
				title = this.iframe.contentDocument.title;
				if (title) return title;
			} catch (_) { }
			title = this.id || this.iframe.src;
		} else {
			title = this.id;
		}
		return title || '';
	};
	prototype.updateTitle = function () {
		this._tab.setTitle(this.getTitle());
	};
	
	prototype['setFixed'] = function (fixed) {
		this._tab.setFixed(fixed);
	};
	
	prototype.setHidden = function (hidden) {
		if (hidden == this.hidden) return;
		this.hidden = hidden;
		
		if (isFunction(this['onvisibilitychange'])) {
			try {
				this['onvisibilitychange']();
			} catch (_) { }
		}
	};
	
	prototype.onActivate = function () {
		this._parent.activateChild(this);
	};
	prototype.activation = function () {
		this.addActiveClass();
		this._tab.addActiveClass();
		this.setHidden(false);
	};
	prototype.deactivation = function () {
		this.removeActiveClass();
		this._tab.removeActiveClass();
		this.setHidden(true);
	};
	
	prototype['close'] = function () {
		if (isFunction(this['onclose'])) {
			try {
				if (this['onclose']() == false) {
					this.activate();
					return;
				}
			} catch (_) { }
		}
		this.deactivation();
		this._parent._removeChild(this);
	};
	
	prototype['isClosed'] = function () {
		return !this.getContainer();
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['id'] = this.id;
		return json;
	};
	
	return Content;
})(Layout);


return (function () {
	
	function DryDock(element) {
		var container = new Container(element);
		
		this['layout'] = container;
		this['contents'] = container.contents;
		
		addEventListener('resize', function () {
			container.onresize();
		});
	}
	var prototype = DryDock.prototype;
	
	// DryDock['Container'] = Container;
	// DryDock['Frame'] = Frame;
	// DryDock['Dock'] = Dock;
	// DryDock['Pane'] = Pane;
	// DryDock['Main'] = Main;
	// DryDock['Sub'] = Sub;
	// DryDock['Content'] = Content;
	
	var DIFF = new Vector(TabStrip.HEIGHT, TabStrip.HEIGHT);
	
	// function c(size, rect, dimension) {
	// 	return (size[dimension] - rect[dimension]) / 2;
	// }
	
	function test(children, rect) {
		var length = children.length;
		for (var i = 0; i < length; i++) {
			var child = children[i];
			if (child._rect.equals(rect)) return true;
		}
		return false;
	}
	function move(children, rect, size) {
		while (test(children, rect)) {
			var diff = new Vector(
				size._width  - rect._right(),
				size._height - rect._bottom()
			)._max(Vector._ZERO)._min(DIFF);
			
			if (diff.equals(Vector._ZERO)) break;
			rect = rect.plus(diff);
		}
		return rect;
	}
	
	prototype['open'] = function (element, options) {
		var content = new Content(element, options);
		this['openMain'](content);
		return content;
	};
	
	prototype['openMain'] = function (content) {
		if (content['isClosed']()) {
			var main = this['layout'].getMain();
			main._appendChild(content, false);
		}
		content.activate();
	};
	prototype['openSub'] = function (content, rect) {
		if (content['isClosed']()) {
			var r = rect == null ? new Rect : Rect._from(rect);
			var s = this['layout'].cSize;
			
			if (!r._width ) r._width  = 300;
			if (!r._height) r._height = 200;
			if (r._top  == null) r._top  = (s._height - r._height) / 2;
			if (r._left == null) r._left = (s._width  - r._width)  / 2;
			
			r = move(this['layout'].floats._children,
				r._round(), s.shrink(Edge.SIZE));
			
			var sub = new Sub();
			sub._appendChild(content, true);
			sub.activateChild(content);
			sub.openFloat(this['layout'], r, Vector._ZERO);
			return;
		}
		content.activate();
	};
	
	prototype['init'] = function () {
		this['layout'].init();
		this['layout'].setChild(new Main());
		this['layout'].activate();
		this['layout'].onresize();
	};
	
	prototype['serialize'] = function () {
		return JSON.stringify(this['layout']);
	};
	prototype['restore'] = function (jsonString) {
		this['layout'].init();
		this['layout'].fromJSON(JSON.parse(jsonString));
		this['layout'].activate();
		this['layout'].onresize();
	};
	
	return DryDock;
})();

})(document, Node, Math, JSON);
