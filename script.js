// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name script.min.js
// ==/ClosureCompiler==

min['DryDock'] = (function ($, Node, Math, JSON) {

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
	div.className = className;
	return div;
}
function toTouch(listener) {
	return function (event) {
		return listener.call(this, event.touches[0]);
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
			event.clientX,
			event.clientY);
	};
	
	prototype._plus  = function (vector) {
		return new Vector(
			this._x + vector._x,
			this._y + vector._y);
	};
	prototype._minus = function (vector) {
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
	
	prototype._round = function () {
		return new Vector(
			Math.round(this._x),
			Math.round(this._y));
	};
	prototype._square = function () {
		return this._x * this._x +
		       this._y * this._y;
	};
	
	prototype._equals = function (vector) {
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
	
	prototype._shrink = function (value) {
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
	
	prototype._plus = function (vector) {
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
	
	prototype._equals = function (rect) {
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
		EdgeDef._TOP    = new EdgeDef('top'),
		EdgeDef._MIDDLE = new EdgeDef('middle'),
		EdgeDef._BOTTOM = new EdgeDef('bottom')
	];
	var HS = [
		EdgeDef._LEFT   = new EdgeDef('left'),
		EdgeDef._CENTER = new EdgeDef('center'),
		EdgeDef._RIGHT  = new EdgeDef('right')
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
			object._forEdgeDef(VS[i], HS[j], CURSORS[i][j]);
		}}
	};
	
	return EdgeDef;
})();

var ButtonDef = (function () {
	
	function ButtonDef(letter, horizontal, order) {
		this._letter = letter;
		this._horizontal = horizontal;
		this._order = order;
	}
	var prototype = ButtonDef.prototype;
	
	ButtonDef._TOP    = new ButtonDef('↑', false, false);
	ButtonDef._RIGHT  = new ButtonDef('→', true,  true);
	ButtonDef._BOTTOM = new ButtonDef('↓', false, true);
	ButtonDef._LEFT   = new ButtonDef('←', true,  false);
	ButtonDef._CENTER = new ButtonDef('＋', false, false);
	
	ButtonDef._MAIN_DIV  = 3;
	ButtonDef._OUTER_DIV = 5;
	
	function Diff(i, diff) {
		this._i = i;
		this._diff = diff;
	}
	function Insert(size, tSize, t, n) {
		this._size = size;
		this._tSize = tSize;
		this._t = t;
		this._n = n;
	}
	
	prototype._sizeOf = function (rect) {
		var size = this._horizontal ? rect._width : rect._height;
		return size - Splitter._SIZE;
	};
	
	prototype._calcInsert = function (target) {
		var parent = target._parent;
		var ti = target._index;
		var ni = this._order ? ti + 1 : ti - 1;
		
		var tSize = target._size;
		var nSize = parent._children[ni]._size;
		var sSize = tSize + nSize;
		
		var tcSize = parent._sizes[ti];
		var ncSize = parent._sizes[ni];
		var scSize = tcSize + ncSize;
		
		var icSize = (scSize - Splitter._SIZE) / 3;
		var acSize = icSize + Splitter._SIZE;
		
		return new Insert(icSize, tcSize,
			new Diff(ti, acSize * tSize / sSize),
			new Diff(ni, acSize * nSize / sSize));
	};
	
	return ButtonDef;
})();

var ButtonPos = (function () {
	
	function ButtonPos(rect) {
		this._c = ButtonPos._center(rect);
		this._f = new Vector(
			GuideButton._MARGIN, GuideButton._MARGIN);
		this._l = new Vector(
			rect._width  - GuideButton._DIFF,
			rect._height - GuideButton._DIFF);
	}
	
	ButtonPos._center = function (rect) {
		return new Vector(
			(rect._width  - GuideButton._SIZE) / 2,
			(rect._height - GuideButton._SIZE) / 2);
	};
	
	return ButtonPos;
})();


var Pointer = (function () {
	
	function Pointer(container, event, draggable) {
		this._container = container;
		
		this._point = Vector._from(event);
		this._diff  = Vector._ZERO;
		this._first = true;
		
		this._hardDrag = draggable._hardDrag;
		this._setDragging(draggable);
	}
	var prototype = Pointer.prototype;
	
	var THRESHOLD = 6 * 6; // const
	
	prototype._setDragging = function (draggable) {
		draggable._container = this._container;
		this._dragging = draggable;
	};
	prototype._deleteContainer = function () {
		delete this._dragging._container;
	};
	
	prototype._mousemove = function (event) {
		var point = Vector._from(event);
		if (this._hardDrag) {
			var sq = point._minus(this._point)._square();
			if (sq < THRESHOLD) return;
			this._hardDrag = false;
		}
		var diff = point._minus(this._point);
		this._point = point;
		
		if (this._first) {
			this._dragging._ondragstart();
			this._first = false;
		}
		var sum = this._diff._plus(diff), arg = sum._round();
		var ret = this._dragging._ondrag(arg);
		this._diff = sum._minus(ret || arg);
	};
	prototype._mouseup = function () {
		this._dragging._ondrop();
		this._deleteContainer();
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


var Model = (function () {
	
	function Model() {
		this._classList = [this._className];
		
		this._element = $.createElement(this._tagName);
		this._element.className = this._className;
		
		this._body = this._element;
	}
	var prototype = Model.prototype;
	
	function indexOf(classList, className) {
		var length = classList.length;
		for (var i = 1; i < length; i++) {
			if (classList[i] == className) return i;
		}
		return 0;
	}
	
	prototype._tagName = 'div';
	prototype._className = NAME_PREFIX;
	
	prototype._setSize = function (width, height) {
		var style = this._element.style;
		style.width  = width  + 'px';
		style.height = height + 'px';
	};
	prototype._unsetSize = function () {
		var style = this._element.style;
		style.width = style.height = '';
	};
	
	prototype._setPos = function (top, left) {
		var style = this._element.style;
		style.top  = top  + 'px';
		style.left = left + 'px';
	};
	
	prototype._setRect = function (rect) {
		this._setPos (rect._top,   rect._left);
		this._setSize(rect._width, rect._height);
	};
	
	prototype._setWidth = function (width) {
		this._element.style.width = width + 'px';
	};
	prototype._setLeft = function (left) {
		this._element.style.left = left + 'px';
	};
	prototype._unsetLeft = function () {
		this._element.style.left = '';
	};
	
	prototype._applyClass = function () {
		this._element.className = this._classList.join(' ');
	};
	prototype._addClass = function (className) {
		if (indexOf(this._classList, className)) return;
		this._classList.push(className);
		this._applyClass();
	};
	prototype._removeClass = function (className) {
		var index = indexOf(this._classList, className);
		if (index) {
			this._classList.splice(index, 1);
			this._applyClass();
		}
	};
	
	return Model;
})();

var Control = (function (Base) {
	
	function Control() {
		Base.call(this);
	}
	var base = Base.prototype;
	var prototype = inherit(Control, base);
	
	var ACTIVE_NAME = NAME_PREFIX + 'active';
	
	prototype._bodyRect = false;
	prototype._parent = null;
	
	prototype._onActivate = function () { };
	prototype._activate = function () {
		this._onActivate();
		this._parent._activate();
	};
	
	prototype._getRect = function () {
		var element = this._bodyRect ? this._body : this._element;
		return Rect._from(element.getBoundingClientRect());
	};
	
	prototype._addActiveClass = function () {
		this._addClass(ACTIVE_NAME);
	};
	prototype._removeActiveClass = function () {
		this._removeClass(ACTIVE_NAME);
	};
	
	prototype._getContainer = function () {
		return this._parent ? this._parent._getContainer() : null;
	};
	
	return Control;
})(Model);

var Draggable = (function (Base) {
	
	function Draggable(parent) {
		Base.call(this);
		var self = this;
		
		this._parent = parent;
		
		function mousedown(event) {
			var target = event.target;
			if (target == this || target == self._body) {
				if (event.button) self._activate();
				else {
					self._getContainer()._mousedown(event, self);
					self._onmousedown();
				}
				return false;
			}
		}
		this._element.onmousedown  = mousedown;
		this._element.ontouchstart = toTouch(mousedown);
	}
	var base = Base.prototype;
	var prototype = inherit(Draggable, base);
	
	var GRABBING_NAME = NAME_PREFIX + 'grabbing';
	
	prototype._hardDrag = false;
	prototype._cursor = '';
	
	prototype._setCursor = function (cursor) {
		this._cursor = cursor;
		this._element.style.cursor = cursor;
	};
	
	prototype._addGrabbingClass = function () {
		this._addClass(GRABBING_NAME);
	};
	prototype._removeGrabbingClass = function () {
		this._removeClass(GRABBING_NAME);
	};
	
	prototype._onmousedown = function () {
		this._activate();
	};
	prototype._ondragstart = function () { };
	// prototype._ondrag = function (delta) { };
	prototype._ondrop = function () { };
	
	return Draggable;
})(Control);


var Splitter = (function (Base) {
	
	function Splitter(pane, index) {
		Base.call(this, pane);
		
		this._index = index;
		this._setCursor(pane._horizontal ? 'ew-resize' : 'ns-resize');
	}
	var base = Base.prototype;
	var prototype = inherit(Splitter, base);
	
	Splitter._SIZE = 6; // px const
	
	prototype._className += 'splitter';
	
	prototype._onmousedown = function () {
		base._onmousedown.call(this);
		this._addGrabbingClass();
	};
	prototype._ondragstart = function () {
		this._parent._onSplitterDragStart(this);
	};
	prototype._ondrag = function (delta) {
		var d = this._parent._onSplitterDrag(this._index,
			this._parent._horizontal ? delta._x : delta._y);
		
		if (d) this._container._layout();
		return this._parent._horizontal ?
			new Vector(d, delta._y) :
			new Vector(delta._x, d);
	};
	prototype._ondrop = function () {
		this._parent._onSplitterDrop();
		this._removeGrabbingClass();
	};
	
	return Splitter;
})(Draggable);

var TabStrip = (function (Base) {
	
	function TabStrip(contents) {
		Base.call(this, contents);
		
		this._tabs = [];
	}
	var base = Base.prototype;
	var prototype = inherit(TabStrip, base);
	
	TabStrip._HEIGHT = 26; // px const
	TabStrip._MAIN = TabStrip._HEIGHT + 2; // px const
	
	prototype._className += 'tabstrip';
	
	prototype._hardDrag = true;
	
	prototype._appendTab = function (tab) {
		tab._tabstrip = this;
		this._tabs.push(tab);
		this._body.appendChild(tab._element);
	};
	prototype._insertTab = function (tab, refTab) {
		tab._tabstrip = this;
		this._tabs.splice(refTab._index(), 0, tab);
		this._body.insertBefore(tab._element, refTab._element);
	};
	prototype._removeTab = function (tab) {
		delete tab._tabstrip;
		this._tabs.splice(tab._index(), 1);
		this._body.removeChild(tab._element);
	};
	
	prototype._onTabDrag = function (tab, x) {
		var index = tab._index(), l = this._tabs.length;
		
		var toIndex = index + Math.round(x / this._tabSize);
		if (toIndex <  0) toIndex = 0;
		if (toIndex >= l) toIndex = l - 1;
		if (toIndex == index) return x;
		
		var to = this._tabs[toIndex]._element;
		this._tabs.splice(index, 1);
		this._tabs.splice(toIndex, 0, tab);
		
		this._body.insertBefore(tab._element,
			toIndex < index ? to : to.nextSibling);
		
		this._parent._moveChild(index, toIndex);
		this._parent._setTabSize();
		return x - this._tabSize * (toIndex - index);
	};
	
	prototype._ondragstart = function () {
		this._parent._onStripDragStart();
	};
	prototype._ondrag = function (delta) {
		return this._parent._onStripDrag(delta);
	};
	prototype._ondrop = function () {
		this._parent._onStripDrop();
	};
	
	prototype._onresize = function (size, tabSize, margin) {
		var length = this._tabs.length;
		var rem = margin < size ? size - margin : 0;
		this._tabSize = tabSize * length > rem ?
			rem / length : tabSize;
		var sum = 0, prev = 0;
		for (var i = 0; i < length; i++) {
			sum += this._tabSize;
			var pos = Math.round(sum);
			this._tabs[i]._setWidth(pos - prev);
			prev = pos;
		}
	};
	
	return TabStrip;
})(Draggable);

var Tab = (function (Base) {
	
	var TITLE_NAME = NAME_PREFIX + 'title';
	var FIXED_NAME = NAME_PREFIX + 'fixed';
	
	function Tab(content) {
		Base.call(this, content);
		
		var title = content._getTitle();
		this._textNode = $.createTextNode(title);
		
		this._body = $.createElement('span');
		this._body.className = TITLE_NAME;
		this._body.appendChild(this._textNode);
		
		var close = new Close(this, content);
		
		this._element.title = title;
		this._element.appendChild(this._body);
		this._element.appendChild(close._element);
	}
	var base = Base.prototype;
	var prototype = inherit(Tab, base);
	
	function Drag(tab) {
		var tabstrip = tab._tabstrip;
		this._contents = tabstrip._parent;
		this._detachable = this._contents instanceof Sub;
		
		if (this._detachable) {
			this._diff = Vector._ZERO;
			this._i = tab._index();
			
			this._size = tabstrip._tabSize;
			this._min = -this._size;
			this._max = this._contents._width -
				this._size * (tabstrip._tabs.length - 1);
		}
		this._x = 0;
	}
	
	prototype._className += 'tab';
	
	prototype._hardDrag = true;
	prototype._tabstrip = null;
	
	prototype._index = function () {
		return this._parent._index;
	};
	
	prototype._setTitle = function (title) {
		this._element.title = title;
		this._textNode.data = title;
	};
	prototype._setFixed = function (fixed) {
		if (fixed) {
			this._addClass(FIXED_NAME);
		} else {
			this._removeClass(FIXED_NAME);
		}
	};
	
	prototype._detach = function (drag) {
		var container = this._container;
		this._removeGrabbingClass();
		this._setWidth(drag._size);
		this._setLeft(drag._size * drag._i);
		
		var contents = drag._contents;
		var rect = contents._getRectOf(container)._round();
		var sub = contents._detachChild(this._parent, drag._i);
		sub._detached = this;
		
		var pointer = container._pointer;
		pointer._deleteContainer();
		pointer._setDragging(sub._tabstrip);
		sub._onStripDragStart();
		return sub._openFloat(container, rect, drag._diff);
	};
	
	prototype._ondragstart = function () {
		this._drag = new Drag(this);
		this._addGrabbingClass();
	};
	prototype._ondrag = function (delta) {
		var drag = this._drag;
		drag._x = this._tabstrip._onTabDrag(this, drag._x + delta._x);
		if (drag._detachable) {
			var diff = drag._diff;
			drag._diff = diff._plus(delta);
			if (drag._x < drag._min || drag._max <= drag._x ||
				Math.abs(drag._diff._y) >= TabStrip._HEIGHT) {
				
				return this._detach(drag)._minus(diff);
			}
		}
		this._setLeft(drag._x);
	};
	prototype._ondrop = function () {
		this._removeGrabbingClass();
		this._unsetLeft();
		
		delete this._drag;
	};
	
	return Tab;
})(Draggable);

var Close = (function (Base) {
	
	function Close(tab, content) {
		Base.call(this, tab);
		
		this._content = content;
		
		this._element.title = '';
		this._body.appendChild($.createTextNode('×'));
	}
	var base = Base.prototype;
	var prototype = inherit(Close, base);
	
	var CANCEL_NAME = NAME_PREFIX + 'cancel';
	
	function Drag(rect) {
		this._rect = rect;
		this._hovering = true;
	}
	
	prototype._tagName = 'a';
	prototype._className += 'close';
	
	prototype._onmousedown = function () {
		this._drag = new Drag(this._getRect());
		this._addActiveClass();
		blur();
	};
	prototype._ondrag = function () {
		var drag = this._drag;
		var point = this._container._pointer._point;
		
		var hovering = drag._rect._contains(point);
		if (hovering != drag._hovering) {
			drag._hovering = hovering;
			if (hovering) {
				this._addActiveClass();
				this._removeClass(CANCEL_NAME);
			} else {
				this._removeActiveClass();
				this._addClass(CANCEL_NAME);
			}
		}
	};
	prototype._ondrop = function () {
		if (this._drag._hovering) {
			this._content['close']();
			this._removeActiveClass();
		} else {
			this._removeClass(CANCEL_NAME);
		}
		delete this._drag;
	};
	
	return Close;
})(Draggable);

var Edge = (function (Base) {
	
	function Edge(frame, v, h, cursor) {
		Base.call(this, frame);
		
		this._v = v;
		this._h = h;
		
		this._addClass(v._className);
		this._addClass(h._className);
		this._setCursor(cursor);
	}
	var base = Base.prototype;
	var prototype = inherit(Edge, base);
	
	Edge._SIZE = 2; // px const
	
	prototype._className += 'edge';
	
	prototype._ondrag = function (delta) {
		var dx = delta._x, dy = delta._y;
		
		var rect = this._parent._rect;
		var mw = rect._width  - TabStrip._HEIGHT;
		var mh = rect._height - TabStrip._HEIGHT;
		
		switch (this._v) {
			case EdgeDef._TOP:
			var t = Edge._SIZE - rect._top;
			if (dy > mh) dy = mh;
			if (dy <  t) dy =  t;
			rect._top    += dy;
			rect._height -= dy;
			break;
			
			case EdgeDef._BOTTOM:
			if (dy < -mh) dy = -mh;
			rect._height += dy;
			break;
		}
		switch (this._h) {
			case EdgeDef._LEFT:
			if (dx > mw) dx = mw;
			rect._left  += dx;
			rect._width -= dx;
			break;
			
			case EdgeDef._RIGHT:
			var r = Frame._MIN_R - rect._right();
			if (dx < -mw) dx = -mw;
			if (dx <   r) dx =   r;
			rect._width += dx;
			break;
		}
		this._parent._layout();
		
		return new Vector(dx, dy);
	};
	
	return Edge;
})(Draggable);


var GuideControl = (function (Base) {
	
	function GuideControl(container) {
		Base.call(this);
		
		this._container = container;
	}
	var base = Base.prototype;
	var prototype = inherit(GuideControl, base);
	
	prototype._hide = function () {
		this._element.style.display = 'none';
	};
	prototype._show = function () {
		this._element.style.display = '';
	};
	
	prototype._setDisable = function (disable) {
		this._disable = disable;
		if (disable) this._hide(); else this._show();
	};
	
	return GuideControl;
})(Model);

var GuideBase = (function (Base) {
	
	function GuideBase(container) {
		Base.call(this, container);
		
		this._area = new GuideArea(container);
		this._top    = new GuideButton(container, ButtonDef._TOP);
		this._right  = new GuideButton(container, ButtonDef._RIGHT);
		this._bottom = new GuideButton(container, ButtonDef._BOTTOM);
		this._left   = new GuideButton(container, ButtonDef._LEFT);
		
		this._hide();
		this._body.appendChild(this._area._element);
		this._body.appendChild(this._top   ._element);
		this._body.appendChild(this._right ._element);
		this._body.appendChild(this._bottom._element);
		this._body.appendChild(this._left  ._element);
	}
	var base = Base.prototype;
	var prototype = inherit(GuideBase, base);
	
	prototype._droppable = null;
	
	prototype._getButton = function (vector) {
		if (this._top   ._hitTest(vector)) return this._top;
		if (this._right ._hitTest(vector)) return this._right;
		if (this._bottom._hitTest(vector)) return this._bottom;
		if (this._left  ._hitTest(vector)) return this._left;
		return null;
	};
	prototype._setDroppable = function (droppable) {
		if (droppable == this._droppable) return;
		if (this._droppable) {
			this._droppable._onleave();
		}
		this._droppable = droppable;
		if (droppable) {
			droppable._onenter();
			this._enter(droppable);
			this._area._show();
		} else {
			this._area._hide();
		}
	};
	
	prototype._onleave = function () {
		this._setDroppable(null);
		this._hide();
	};
	
	prototype._drop = function (contents, target) {
		if (this._droppable) {
			this._droppable._ondrop(contents, target);
		}
		this._onleave();
	};
	prototype._ondrop = function () {
		delete this._droppable;
		delete this._drag;
	};
	
	return GuideBase;
})(GuideControl);

var Guide = (function (Base) {
	
	function Guide(container) {
		Base.call(this, container);
		
		this._child = new GuidePane(container);
		this._body.appendChild(this._child._element);
	}
	var base = Base.prototype;
	var prototype = inherit(Guide, base);
	
	function Drag(contents) {
		this._contents = contents;
		this._target = null;
		this._first = true;
	}
	
	prototype._className += 'guide';
	
	prototype._drag = null;
	
	prototype._ondragstart = function (contents) {
		this._drag = new Drag(contents);
	};
	prototype._ondrag = function () {
		var drag = this._drag;
		if (drag._first) {
			this._container._calcRect();
			var pos = new ButtonPos(this._container._cRect);
			
			this._top   ._setPos(pos._f._y, pos._c._x);
			this._right ._setPos(pos._c._y, pos._l._x);
			this._bottom._setPos(pos._l._y, pos._c._x);
			this._left  ._setPos(pos._c._y, pos._f._x);
			
			this._show();
			drag._first = false;
		}
		var point = this._container._pointer._point;
		
		var target = this._container._getChild(point);
		if (target != drag._target) {
			if (drag._target) {
				this._child._setDroppable(null);
			}
			drag._target = target;
			if (target) {
				this._child._onenter(target);
			} else {
				this._child._onleave();
			}
		}
		var relative;
		var top = null;
		if (target) {
			relative = point._of(target._cRect);
			top = this._child._getButton(relative);
		}
		
		var button = top ? null :
			this._getButton(point._of(this._container._cRect));
		this._setDroppable(button);
		
		if (target) {
			this._child._ondrag(relative, top, button);
		}
	};
	
	prototype._enter = function (button) {
		this._area._setOuterArea(button._def, this._container._cRect);
	};
	
	prototype._ondrop = function () {
		var drag = this._drag;
		if (drag) {
			if (drag._target) {
				this._child._drop(drag._contents, drag._target);
			}
			this._drop(drag._contents, this._container);
		}
		base._ondrop.call(this);
		this._child._ondrop();
		this._container._deleteRect();
	};
	
	return Guide;
})(GuideBase);

var GuidePane = (function (Base) {
	
	function GuidePane(container) {
		Base.call(this, container);
		
		this._center = new GuideButton(container, ButtonDef._CENTER);
		this._guidestrip = new GuideStrip(container);
		this._body.appendChild(this._center._element);
		this._body.appendChild(this._guidestrip._element);
	}
	var base = Base.prototype;
	var prototype = inherit(GuidePane, base);
	
	function Drag(target, container) {
		this._target = target;
		
		this._rect = target._cRect._of(container._cRect);
		this._pane = target._parent instanceof Pane;
		this._main = target instanceof Main;
	}
	
	prototype._className += 'guidepane';
	
	prototype._onenter = function (target) {
		var drag = new Drag(target, this._container);
		this._drag = drag;
		
		this._setRect(drag._rect);
		
		var c = ButtonPos._center(drag._rect);
		this._top   ._setPos(c._y - GuideButton._DIFF, c._x);
		this._right ._setPos(c._y, c._x + GuideButton._DIFF);
		this._bottom._setPos(c._y + GuideButton._DIFF, c._x);
		this._left  ._setPos(c._y, c._x - GuideButton._DIFF);
		this._center._setPos(c._y, c._x);
		
		var frame = target._parent instanceof Frame;
		this._top   ._setDisable(frame);
		this._right ._setDisable(frame);
		this._bottom._setDisable(frame);
		this._left  ._setDisable(frame);
		this._center._setDisable(drag._main);
		
		this._show();
	};
	prototype._ondrag = function (vector, button, hit) {
		if (button || hit || this._drag._main) {
			this._setDroppable(button);
			return;
		}
		if (vector._y < TabStrip._HEIGHT) {
			this._setDroppable(this._guidestrip);
			this._guidestrip._ondrag(vector);
			return;
		}
		this._setDroppable(null);
	};
	
	prototype._enter = function (droppable) {
		var drag = this._drag;
		var target = drag._target;
		
		if (droppable == this._guidestrip) {
			this._area._setStripArea();
			droppable._enter(target);
			return;
		}
		var def = droppable._def;
		if (drag._main) {
			this._area._setMainArea(def, drag._rect);
			return;
		}
		if (drag._pane && def != ButtonDef._CENTER) {
			var pane = target._parent;
			if (pane._horizontal == def._horizontal) {
				var end = def._order ? pane._children.length - 1 : 0;
				if (target._index != end) {
					this._area._setInsertArea(def, target);
					return;
				}
			}
		}
		this._area._setArea(def, drag._rect);
	};
	
	prototype._getButton = function (vector) {
		var button = base._getButton.call(this, vector);
		if (button) return button;
		if (this._center._hitTest(vector)) return this._center;
		return null;
	};
	
	return GuidePane;
})(GuideBase);


var GuideDroppable = (function (Base) {
	
	function GuideDroppable(container) {
		Base.call(this, container);
	}
	var base = Base.prototype;
	var prototype = inherit(GuideDroppable, base);
	
	prototype._ondrop = function (contents, target) {
		var parent = target._parent;
		contents._parent._removeChild(contents, true);
		this._drop(contents, target);
		
		target._activate();
		this._container._layout();
		if (parent instanceof Frame) parent._layout();
	};
	
	prototype._sizeOf = function (layout, divisor) {
		var size = this._def._sizeOf(layout._cRect);
		return Math.floor(size / divisor);
	};
	prototype._test = function (layout) {
		return layout instanceof Dock &&
			layout._horizontal == this._def._horizontal;
	};
	prototype._newDock = function (child, pane) {
		var dock = new Dock(this._def._horizontal);
		dock._setChild(child);
		
		var dockpane = this._def._order ? dock._after : dock._before;
		dockpane._appendChild(pane);
		
		return dock;
	};
	
	prototype._outer = function (contents, container, child) {
		contents._size = this._sizeOf(child, ButtonDef._OUTER_DIV);
		if (this._test(child)) {
			if (this._def._order) {
				child._after._appendChild(contents);
			} else {
				child._before._prependChild(contents);
			}
		} else {
			container._removeChild();
			container._setChild(this._newDock(child, contents));
		}
	};
	prototype._dockPane = function (contents, target, parent) {
		contents._size = this._sizeOf(target, ButtonDef._MAIN_DIV);
		if (this._test(parent)) {
			if (this._def._order) {
				parent._after._prependChild(contents);
			} else {
				parent._before._appendChild(contents);
			}
		} else {
			parent._removeChild();
			parent._setChild(this._newDock(target, contents));
		}
	};
	
	prototype._newPane = function (contents, target, parent) {
		var ref = parent._children[target._index + 1];
		parent._removeChild(target, true);
		
		var pane = new Pane(this._def._horizontal);
		pane._size = target._size;
		contents._size = target._size = .5;
		
		if (this._def._order) {
			pane._appendChild(target);
			pane._appendChild(contents);
		} else {
			pane._appendChild(contents);
			pane._appendChild(target);
		}
		parent._insertChild(pane, ref);
	};
	prototype._splitPane = function (contents, target, parent) {
		var size = parent._sizes[target._index];
		parent._remSize -= Splitter._SIZE;
		parent._calcSizes();
		
		var half = (size - Splitter._SIZE) / (parent._remSize * 2);
		contents._size = half;
		target  ._size = half;
		
		parent._insertChild(contents, this._def._order ?
			parent._children[target._index + 1] : target);
	};
	prototype._insertPane = function (contents, target, parent) {
		var ins = this._def._calcInsert(target);
		var i = this._def._order ? ins._n._i : ins._t._i;
		
		parent._sizes[ins._t._i] -= ins._t._diff;
		parent._sizes[ins._n._i] -= ins._n._diff;
		parent._sizes.splice(i, 0, ins._size);
		
		parent._insertChild(contents, this._def._order ?
			parent._children[ins._t._i + 1] : target);
		
		parent._remSize -= Splitter._SIZE;
		parent._calcSizes();
	};
	
	prototype._mergeTabs = function (contents, target, index) {
		var refChild = target._children[index];
		var children = contents._children;
		var length = children.length;
		for (var i = 0; i < length; i++) {
			target._insertChild(children[i], refChild);
		}
		target._activateChild(contents._active);
	};
	
	return GuideDroppable;
})(GuideControl);

var GuideButton = (function (Base) {
	
	function GuideButton(container, def) {
		Base.call(this, container);
		
		this._def = def;
		this._body.appendChild($.createTextNode(def._letter));
	}
	var base = Base.prototype;
	var prototype = inherit(GuideButton, base);
	
	GuideButton._SIZE   = 40; // px const
	GuideButton._MARGIN =  3; // px const
	GuideButton._DIFF = GuideButton._SIZE + GuideButton._MARGIN;
	
	var HOVER_NAME = NAME_PREFIX + 'hover';
	
	prototype._className += 'guidebutton';
	
	prototype._setPos = function (top, left) {
		this._rect = new Rect(top, left,
			GuideButton._SIZE, GuideButton._SIZE);
		base._setPos.call(this, top, left);
	};
	
	prototype._hitTest = function (vector) {
		if (this._disable) return false;
		return this._rect._contains(vector);
	};
	
	prototype._onenter = function () {
		this._addClass(HOVER_NAME);
	};
	prototype._onleave = function () {
		this._removeClass(HOVER_NAME);
	};
	
	prototype._drop = function (contents, target) {
		var parent = target._parent;
		if (this._def == ButtonDef._CENTER) {
			this._mergeTabs(contents, target, -1);
			return;
		}
		if (target == this._container) {
			this._outer(contents, target, target._child);
			this._container._updateMinSize();
			return;
		}
		if (target instanceof Main) {
			this._dockPane(contents, target, parent);
			this._container._updateMinSize();
			return;
		}
		if (parent instanceof Pane &&
			parent._horizontal == this._def._horizontal) {
			
			var end = this._def._order ? parent._children.length - 1 : 0;
			if (target._index == end) {
				this._splitPane(contents, target, parent);
			} else {
				this._insertPane(contents, target, parent);
			}
		} else {
			this._newPane(contents, target, parent);
		}
	};
	
	return GuideButton;
})(GuideDroppable);

var GuideStrip = (function (Base) {
	
	function GuideStrip(container) {
		Base.call(this, container);
		
		this._area = new GuideArea(container);
		this._body.appendChild(this._area._element);
	}
	var base = Base.prototype;
	var prototype = inherit(GuideStrip, base);
	
	function Drag(target) {
		this._index = -1;
		this._tabSize = target._tabstrip._tabSize;
		this._length  = target._children.length;
	}
	
	prototype._className += 'guidestrip';
	
	prototype._enter = function (target) {
		this._drag = new Drag(target);
	};
	
	prototype._onenter = function () {
		this._area._show();
	};
	prototype._onleave = function () {
		this._area._hide();
	};
	prototype._ondrag = function (vector) {
		var drag = this._drag;
		var index = Math.floor(vector._x / drag._tabSize);
		if (index > drag._length) index = drag._length;
		if (index != drag._index) {
			drag._index = index;
			this._area._setTabArea(index, drag._tabSize);
		}
	};
	
	prototype._drop = function (contents, target) {
		this._mergeTabs(contents, target, this._drag._index);
		delete this._drag;
	};
	
	return GuideStrip;
})(GuideDroppable);

var GuideArea = (function (Base) {
	
	function GuideArea(container) {
		Base.call(this, container);
		
		this._hide();
	}
	var base = Base.prototype;
	var prototype = inherit(GuideArea, base);
	
	var HEIGHT_PX = TabStrip._HEIGHT + 'px';
	
	prototype._className += 'guidearea';
	
	prototype._set = function (def, margin, value) {
		var px = value + Splitter._SIZE + 'px';
		var s = this._element.style;
		s.top = s.right = s.bottom = s.left = margin;
		switch (def) {
			case ButtonDef._TOP: s.bottom = px; break;
			case ButtonDef._RIGHT: s.left = px; break;
			case ButtonDef._BOTTOM: s.top = px; break;
			case ButtonDef._LEFT: s.right = px; break;
		}
	};
	
	prototype._setArea = function (def, rect) {
		this._set(def, '0', def._sizeOf(rect) / 2);
	};
	prototype._setMainArea = function (def, rect) {
		var size = def._sizeOf(rect);
		this._set(def, '0', size - size / ButtonDef._MAIN_DIV);
	};
	prototype._setOuterArea = function (def, rect) {
		var size = def._sizeOf(rect) - Container._M2;
		this._set(def, Container._MP,
			size - size / ButtonDef._OUTER_DIV + Container._MARGIN);
	};
	
	prototype._setInsertArea = function (def, target) {
		var ins = def._calcInsert(target);
		this._set(def, '0', ins._tSize - ins._t._diff);
		
		var px = -ins._n._diff + 'px';
		var s = this._element.style;
		switch (def) {
			case ButtonDef._TOP:    s.top    = px; break;
			case ButtonDef._RIGHT:  s.right  = px; break;
			case ButtonDef._BOTTOM: s.bottom = px; break;
			case ButtonDef._LEFT:   s.left   = px; break;
		}
	};
	
	prototype._setTabArea = function (index, width) {
		this._setLeft(width * index);
		this._setWidth(width);
	};
	prototype._setStripArea = function () {
		var s = this._element.style;
		s.top = HEIGHT_PX;
		s.right = s.bottom = s.left = '0';
	};
	
	return GuideArea;
})(GuideControl);


var Layout = (function (Base) {
	
	function Layout() {
		Base.call(this);
	}
	var base = Base.prototype;
	var prototype = inherit(Layout, base);
	
	var HORIZONTAL_NAME = NAME_PREFIX + 'horizontal';
	
	prototype._getRectOf = function (layout) {
		return this._getRect()._of(layout._getRect());
	};
	
	prototype._addHorizontalClass = function () {
		this._addClass(HORIZONTAL_NAME);
	};
	
	prototype.toJSON = function () {
		return {};
	};
	
	return Layout;
})(Control);

var Single = (function (Base) {
	
	function Single() {
		Base.call(this);
		
		this._child = null;
	}
	var base = Base.prototype;
	var prototype = inherit(Single, base);
	
	prototype._setChild = function (child) {
		this._child = child;
		child._parent = this;
		this._body.appendChild(child._element);
	};
	prototype._removeChild = function () {
		delete this._child._parent;
		this._body.removeChild(this._child._element);
		this._child = null;
	};
	
	prototype._calcRect = function () {
		this._cRect = this._getRect();
		this._child._calcRect();
	};
	prototype._deleteRect = function () {
		delete this._cRect;
		this._child._deleteRect();
	};
	
	prototype._deactivateAll = function () {
		this._child._deactivateAll();
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['child'] = this._child;
		return json;
	};
	
	return Single;
})(Layout);

var Multiple = (function (Base) {
	
	function Multiple() {
		Base.call(this);
		
		this._children = [];
	}
	var base = Base.prototype;
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
	prototype._insertChild = function (child, refChild) {
		child._parent = this;
		this._children.splice(refChild._index, 0, child);
		var length = this._children.length;
		for (var i = refChild._index; i < length; i++) {
			this._children[i]._index = i;
		}
		this._body.insertBefore(child._element, refChild._element);
	};
	
	prototype._calcRect = function () {
		this._cRect = this._getRect();
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i]._calcRect();
		}
	};
	prototype._getChild = function (cPoint) {
		if (this._cRect._contains(cPoint)) {
			var length = this._children.length;
			for (var i = 0; i < length; i++) {
				var child = this._children[i]._getChild(cPoint);
				if (child) return child;
			}
		}
		return null;
	};
	prototype._deleteRect = function () {
		delete this._cRect;
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i]._deleteRect();
		}
	};
	
	prototype._deactivateAll = function () {
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i]._deactivateAll();
		}
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['children'] = this._children;
		return json;
	};
	
	return Multiple;
})(Layout);

var Activator = (function (Base) {
	
	function Activator() {
		Base.call(this);
		
		this._active = null;
	}
	var base = Base.prototype;
	var prototype = inherit(Activator, base);
	
	prototype._removeChild = function (child) {
		base._removeChild.call(this, child);
		
		if (child == this._active) {
			var length = this._children.length;
			if (length) {
				var index = child._index;
				if (index == length) index = length - 1;
				this._activateChild(this._children[index]);
			} else {
				this._active = null;
			}
		}
	};
	
	prototype._activateChild = function (child) {
		if (child == this._active) return;
		if (this._active) this._active._deactivation();
		this._active = child;
		child._activation();
	};
	
	return Activator;
})(Multiple);


var DockBase = (function (Base) {
	
	function DockBase() {
		Base.call(this);
	}
	var base = Base.prototype;
	var prototype = inherit(DockBase, base);
	
	prototype._getMain = function () {
		return this._child._getMain();
	};
	
	prototype._fromJSON = function (container, json) {
		var child = json['child'];
		switch (child['type']) {
			case Dock._TYPE:
			this._setChild(Dock._fromJSON(container, child));
			break;
			
			case Main._TYPE:
			this._setChild(Main._fromJSON(container, child));
			break;
		}
	};
	
	return DockBase;
})(Single);

var Container = (function (Base) {
	
	var BODY_NAME     = NAME_PREFIX + 'body';
	var OVERLAY_NAME  = NAME_PREFIX + 'overlay';
	var DRAGGING_NAME = NAME_PREFIX + 'dragging';
	var FLOATING_NAME = NAME_PREFIX + 'floating';
	
	function Container(element) {
		Base.call(this);
		var self = this;
		
		this._contents = {};
		for (var node = element.firstChild; node; ) {
			var next = node.nextSibling;
			element.removeChild(node);
			if (node.nodeType == Node.ELEMENT_NODE) {
				var id = node.id;
				if (id) {
					var o = new Option(id);
					this._contents[id] = new Content(node, o);
				}
			}
			node = next;
		}
		
		// DOM
		this._body    = createDiv(BODY_NAME);
		this._overlay = createDiv(OVERLAY_NAME);
		this._floats = new Floats(this);
		this._guide  = new Guide(this);
		
		this._element.appendChild(this._body);
		this._element.appendChild(this._floats._element);
		this._element.appendChild(this._guide._element);
		this._element.appendChild(this._overlay);
		this._element.onmousedown = function (event) {
			if (event.target == this) {
				self._activate();
				return false;
			}
		};
		element.appendChild(this._element);
		
		this._mousemove = function (event) {
			self._pointer._mousemove(event);
		};
		this._mouseup = function () {
			this.onmousemove = null;
			this.onmouseup   = null;
			this.ontouchmove = null;
			this.ontouchend  = null;
			
			self._pointer._mouseup();
			delete self._pointer;
			
			self._removeClass(DRAGGING_NAME);
		};
		this._touchmove = toTouch(this._mousemove);
		this._touchend  = toTouch(this._mouseup);
	}
	var base = Base.prototype;
	var prototype = inherit(Container, base);
	
	Container._MARGIN = 6; // px const
	Container._M2 = Container._MARGIN * 2;
	Container._MP = Container._MARGIN + 'px';
	
	prototype._className += 'container';
	
	prototype._minSize = null;
	prototype._cSize   = null;
	
	prototype._mousedown = function (event, draggable) {
		this._pointer = new Pointer(this, event, draggable);
		
		this._overlay.style.cursor = draggable._cursor;
		this._addClass(DRAGGING_NAME);
		
		this._element.onmousemove = this._mousemove;
		this._element.onmouseup   = this._mouseup;
		this._element.ontouchmove = this._touchmove;
		this._element.ontouchend  = this._touchend;
	};
	
	prototype._calcRect = function () {
		base._calcRect.call(this);
		this._floats._calcRect();
	};
	prototype._getChild = function (cPoint) {
		if (this._cRect._contains(cPoint)) {
			var child = this._floats._getChild(cPoint);
			if (child) {
				if (child instanceof Frame) return null;
				return child;
			}
			return this._child._getChild(cPoint);
		}
		return null;
	};
	prototype._deleteRect = function () {
		base._deleteRect.call(this);
		this._floats._deleteRect();
	};
	
	prototype._activateFloats = function () {
		this._addClass(FLOATING_NAME);
		blur();
	};
	prototype._activate = function () { // stop bubbling
		this._removeClass(FLOATING_NAME);
		blur();
	};
	
	prototype._deactivateAll = function () {
		base._deactivateAll.call(this);
		this._floats._deactivateAll();
	};
	
	prototype['onresize'] = function () {
		this._cSize = Size._from(this._element);
		if (this._minSize) {
			this._updateSize();
		} else {
			this._updateMinSize();
		}
		this._layout();
	};
	prototype._updateMinSize = function () {
		this._minSize = this._child._getMinSize();
		this._updateSize();
	};
	prototype._updateSize = function () {
		this._size = this._cSize
			._shrink(Container._M2)._max(this._minSize);
	};
	prototype._layout = function () {
		this._child._onresize(this._size._width, this._size._height);
	};
	
	prototype._getContainer = function () {
		return this;
	};
	
	prototype._init = function () {
		if (this._child) {
			this._deactivateAll();
			this._removeChild();
			this._minSize = null;
		}
		this._floats._removeAll();
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['floats'] = this._floats;
		return json;
	};
	prototype._fromJSON = function (json) {
		base._fromJSON.call(this, this, json);
		this._floats._fromJSON(this, json['floats']);
	};
	
	return Container;
})(DockBase);

var Floats = (function (Base) {
	
	function Floats(container) {
		Base.call(this);
		
		this._parent = container;
	}
	var base = Base.prototype;
	var prototype = inherit(Floats, base);
	
	prototype._className += 'floats';
	
	prototype._appendChild = function (frame) {
		frame._setZ(this._children.length);
		base._appendChild.call(this, frame);
		frame._layout();
	};
	prototype._removeChild = function (frame, pauseLayout) {
		base._removeChild.call(this, frame);
		if (pauseLayout) return;
		
		var length = this._children.length;
		for (var i = frame._index; i < length; i++) {
			this._children[i]._setZ(i);
		}
		
		if (length) return;
		this._parent._activate();
	};
	prototype._removeAll = function () {
		for (var i = this._children.length - 1; i >= 0; i--) {
			this._removeChild(this._children[i], true);
		}
	};
	
	prototype._calcRect = function () {
		var length = this._children.length - 1;
		for (var i = 0; i < length; i++) {
			this._children[i]._calcRect();
		}
	};
	prototype._getChild = function (cPoint) {
		for (var i = this._children.length - 2; i >= 0; i--) {
			var child = this._children[i]._getChild(cPoint);
			if (child) return child;
		}
		return null;
	};
	prototype._deleteRect = function () {
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i]._deleteRect();
		}
	};
	
	prototype._activateChild = function (frame) {
		base._activateChild.call(this, frame);
		
		this._children.splice(frame._index, 1);
		this._children.push(frame);
		
		var length = this._children.length;
		for (var i = frame._index; i < length; i++) {
			var child = this._children[i];
			child._index = i;
			child._setZ(i);
		}
	};
	
	prototype._activate = function () { // stop bubbling
		this._parent._activateFloats();
	};
	
	prototype._fromJSON = function (container, json) {
		var length = json['children'].length;
		for (var i = 0; i < length; i++) {
			var child = json['children'][i];
			var frame = Frame._fromJSON(container, child);
			this._appendChild(frame);
		}
	};
	
	return Floats;
})(Activator);

var Frame = (function (Base) {
	
	var FBODY_NAME = NAME_PREFIX + 'fbody';
	
	function Frame(sub) {
		Base.call(this);
		
		// DOM
		this._body = createDiv(FBODY_NAME);
		this._setChild(sub);
		
		this._element.appendChild(this._body);
		EdgeDef._forEach(this);
	}
	var base = Base.prototype;
	var prototype = inherit(Frame, base);
	
	Frame._MIN_R = Edge._SIZE + TabStrip._HEIGHT;
	
	Frame._fromJSON = function (container, json) {
		var sub = Sub._fromJSON(container, json['child']);
		var frame = new Frame(sub);
		frame._rect = Rect._from(json['rect']);
		return frame;
	};
	
	var HANDLE = 6; // px const
	var H2 = HANDLE * 2;
	
	prototype._className += 'frame';
	
	prototype._bodyRect = true;
	
	prototype._forEdgeDef = function (v, h, cursor) {
		if (cursor) {
			var edge = new Edge(this, v, h, cursor);
			this._element.appendChild(edge._element);
		}
	};
	
	prototype._setZ = function (zIndex) {
		this._element.style.zIndex = zIndex;
	};
	
	prototype._removeChild = function (sub, pauseLayout) {
		this._parent._removeChild(this, pauseLayout);
	};
	
	prototype._getChild = function (cPoint) {
		if (this._cRect._contains(cPoint)) {
			return this._child._getChild(cPoint) || this;
		}
		return null;
	};
	
	prototype._onActivate = function () {
		this._parent._activateChild(this);
	};
	prototype._activation = function () {
		this._addActiveClass();
	};
	prototype._deactivation = function () {
		this._removeActiveClass();
	};
	
	prototype._layout = function () {
		this._setRect(this._rect);
		this._child._layout(this._rect._width);
	};
	prototype._move = function (vector) {
		this._rect = this._rect._plus(vector);
		this._setPos(this._rect._top, this._rect._left);
	};
	
	prototype._setSize = function (width, height) {
		base._setSize.call(this,
			width  + H2,
			height + H2);
	};
	prototype._setPos = function (top, left) {
		base._setPos.call(this,
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

var Dock = (function (Base) {
	
	function Dock(horizontal) {
		Base.call(this);
		
		this._horizontal = horizontal;
		this._before = new DockPane(this, false);
		this._after  = new DockPane(this, true);
		
		// DOM
		if (horizontal) this._addHorizontalClass();
		this._body.appendChild(this._before._element);
		this._body.appendChild(this._after ._element);
	}
	var base = Base.prototype;
	var prototype = inherit(Dock, base);
	
	Dock._TYPE = 'dock';
	
	Dock._fromJSON = function (container, json) {
		var dock = new Dock(json['horizontal']);
		dock._fromJSON(container, json);
		dock._before._fromJSON(container, json['before']);
		dock._after ._fromJSON(container, json['after']);
		return dock;
	};
	
	prototype._className += 'dock';
	
	prototype._onRemove = function () {
		if (this._before._children.length) return;
		if (this._after ._children.length) return;
		
		var parent = this._parent;
		parent._removeChild();
		if (parent     instanceof Dock &&
		    this._child instanceof Dock) {
			
			parent._setChild(this._child._child);
			parent._before._merge(this._child._before);
			parent._after ._merge(this._child._after);
		} else {
			parent._setChild(this._child);
		}
	};
	
	prototype._setChild = function (child) {
		this._child = child;
		child._parent = this;
		this._body.insertBefore(child._element, this._after._element);
	};
	
	prototype._calcRect = function () {
		base._calcRect.call(this);
		this._before._calcRect();
		this._after ._calcRect();
	};
	prototype._getChild = function (cPoint) {
		if (this._cRect._contains(cPoint)) {
			return this._child ._getChild(cPoint)
			    || this._before._getChild(cPoint)
			    || this._after ._getChild(cPoint);
		}
		return null;
	};
	prototype._deleteRect = function () {
		base._deleteRect.call(this);
		this._before._deleteRect();
		this._after ._deleteRect();
	};
	
	prototype._deactivateAll = function () {
		base._deactivateAll.call(this);
		this._before._deactivateAll();
		this._after ._deactivateAll();
	};
	
	prototype._getMinSize = function () {
		var size = this._child._getMinSize();
		var sum = this._before._size + this._after._size;
		return this._horizontal ?
			new Size(size._width + sum, size._height) :
			new Size(size._width, size._height + sum);
	};
	
	prototype._onresize = function (width, height) {
		this._setSize(width, height);
		var sum = this._before._size + this._after._size;
		if (this._horizontal) {
			this._before._onresize(this._before._size, height);
			this._child ._onresize(width - sum,      height);
			this._after ._onresize(this._after._size,  height);
		} else {
			this._before._onresize(width, this._before._size);
			this._child ._onresize(width, height - sum);
			this._after ._onresize(width, this._after._size);
		}
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['before'] = this._before;
		json['after']  = this._after;
		json['horizontal'] = this._horizontal;
		json['type'] = Dock._TYPE;
		return json;
	};
	
	return Dock;
})(DockBase);


var PaneBase = (function (Base) {
	
	function PaneBase(horizontal) {
		Base.call(this);
		
		this._horizontal = horizontal;
		this._splitters = [];
		
		// DOM
		if (horizontal) this._addHorizontalClass();
	}
	var base = Base.prototype;
	var prototype = inherit(PaneBase, base);
	
	prototype._drag = null;
	
	prototype._onSplitterDrop = function () {
		delete this._drag;
	};
	
	prototype._appendSplitter = function () {
		var splitter = new Splitter(this, this._splitters.length);
		this._splitters.push(splitter);
		this._body.appendChild(splitter._element);
	};
	prototype._removeSplitter = function (i) {
		var splitter = this._splitters[i];
		this._splitters.splice(i, 1);
		for (var l = this._splitters.length; i < l; i++) {
			this._splitters[i]._index = i;
		}
		this._body.removeChild(splitter._element);
	};
	prototype._insertSplitter = function (i, refElement) {
		var splitter = new Splitter(this, i);
		this._splitters.splice(i, 0, splitter);
		for (var l = this._splitters.length; i < l; i++) {
			this._splitters[i]._index = i;
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
	
	prototype._fromJSON = function (container, json) {
		var length = json['children'].length;
		for (var i = 0; i < length; i++) {
			var child = json['children'][i];
			var layout;
			switch (child['type']) {
				case Pane._TYPE:
				layout = Pane._fromJSON(container, child);
				break;
				
				case Sub._TYPE:
				layout = Sub._fromJSON(container, child);
				break;
			}
			layout._size = child['size'];
			this._appendChild(layout);
		}
	};
	
	return PaneBase;
})(Multiple);

var DockPane = (function (Base) {
	
	function DockPane(dock, order) {
		Base.call(this, dock._horizontal);
		this._parent = dock;
		
		this._size = 0;
		this._order = order;
	}
	var base = Base.prototype;
	var prototype = inherit(DockPane, base);
	
	function Drag(dockpane, container) {
		this._container = container;
		
		var size = container._size;
		var min  = container._minSize;
		var rem = dockpane._horizontal ?
			size._width  - min._width :
			size._height - min._height;
		
		this._maxSize = dockpane._size + rem;
	}
	
	prototype._className += 'dockpane';
	
	prototype._onSplitterDragStart = function (splitter) {
		var inner = this._order ? 0 : this._children.length - 1;
		if (splitter._index == inner) {
			this._drag = new Drag(this, splitter._container);
		}
	};
	prototype._onSplitterDrag = function (i, delta) {
		var child = this._children[i];
		var d = this._order ? -delta : delta;
		
		if (d < -child._size) d = -child._size;
		var drag = this._drag;
		if (drag) {
			if (d < -this._size) d = this._size;
			var rem = drag._maxSize - this._size;
			if (rem < d) d = rem;
			this._size  += d;
			child._size += d;
			
			drag._container._updateMinSize();
		} else {
			var next = this._children[this._order ? i - 1 : i + 1];
			if (d > next._size) d = next._size;
			child._size += d;
			next ._size -= d;
		}
		return this._order ? -d : d;
	};
	
	prototype._merge = function (dockpane) {
		var children = dockpane._children;
		var i, length = children.length;
		if (this._order) {
			for (i = length - 1; i >= 0; i--) {
				this._prependChild(children[i]);
			}
		} else {
			for (i = 0; i < length; i++) {
				this._appendChild(children[i]);
			}
		}
	};
	
	prototype._expand = function (child) {
		this._size += child._size + Splitter._SIZE;
	};
	prototype._appendChild = function (child) {
		this._expand(child);
		if (this._order) {
			this._appendSplitter();
			base._appendChild.call(this, child);
		} else {
			base._appendChild.call(this, child);
			this._appendSplitter();
		}
	};
	prototype._removeChild = function (child, pauseLayout) {
		this._size -= child._size + Splitter._SIZE;
		base._removeChild.call(this, child);
		this._removeSplitter(child._index);
		
		if (pauseLayout) return;
		
		this._getContainer()._updateMinSize();
		this._parent._onRemove();
	};
	prototype._insertChild = function (child, refChild) {
		if (refChild == null) {
			this._appendChild(child);
			return;
		}
		this._expand(child);
		base._insertChild.call(this, child, refChild);
		this._insertSplitter(
			child._index + this._order, refChild._element);
	};
	prototype._prependChild = function (child) {
		this._insertChild(child, this._children[0]);
	};
	
	prototype._onresize = function (width, height) {
		this._setSize(width, height);
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

var Pane = (function (Base) {
	
	function Pane(horizontal) {
		Base.call(this, horizontal);
		
		this._sizes = [];
		this._collapse = false;
	}
	var base = Base.prototype;
	var prototype = inherit(Pane, base);
	
	Pane._TYPE = 'pane';
	
	Pane._fromJSON = function (container, json) {
		var pane = new Pane(json['horizontal']);
		pane._fromJSON(container, json);
		return pane;
	};
	
	function Drag() { }
	
	var COLLAPSE_NAME = NAME_PREFIX + 'collapse';
	
	prototype._className += 'pane';
	
	prototype._onSplitterDragStart = function () {
		if (this._remSize) {
			this._calcSizes();
		} else {
			this._drag = new Drag();
		}
	};
	prototype._onSplitterDrag = function (i, delta) {
		if (this._drag) return;
		var n = i + 1;
		
		var iSize = this._sizes[i];
		var nSize = this._sizes[n];
		
		if (delta < -iSize) delta = -iSize;
		if (delta >  nSize) delta =  nSize;
		
		this._children[i]._size = (iSize + delta) / this._remSize;
		this._children[n]._size = (nSize - delta) / this._remSize;
		
		return delta;
	};
	
	prototype._merge = function (pane, ref) {
		var children = pane._children;
		var i, length = children.length;
		var child;
		
		this._remSize -= pane._collapse ?
			this._sizes[ref._index] : Splitter._SIZE * (length - 1);
		if (this._remSize) {
			this._calcSizes();
			var sizes = pane._sizes;
			for (i = 0; i < length; i++) {
				child = children[i];
				child._size = sizes[i] / this._remSize;
				this._insertChild(child, ref);
			}
		} else {
			for (i = 0; i < length; i++) {
				child = children[i];
				child._size *= ref._size;
				this._insertChild(child, ref);
			}
		}
		this._removeChild(ref, true);
	};
	
	prototype._appendChild = function (child) {
		if (this._children.length) this._appendSplitter();
		base._appendChild.call(this, child);
	};
	prototype._removeChild = function (child, pauseLayout) {
		base._removeChild.call(this, child);
		var index = child._index;
		if (this._splitters.length) {
			this._removeSplitter(index ? index - 1 : index);
		}
		if (pauseLayout) return;
		
		var l = this._children.length;
		if (l == 1) {
			var remChild = this._children[0];
			if (remChild    instanceof Pane &&
			    this._parent instanceof Pane) {
				
				this._parent._merge(remChild, this);
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
				this._sizes[index] + Splitter._SIZE;
			var ls = cl._size;
			var rs = cr._size;
			var sum = ls + rs;
			if (sum == 0.) { sum = 1.; ls = rs = .5; }
			
			if (this._collapse) {
				cl._size += size * ls / sum;
				cr._size += size * rs / sum;
			} else {
				this._remSize += Splitter._SIZE;
				this._sizes.splice(index, 1);
				this._sizes[li] += size * ls / sum;
				this._sizes[ri] += size * rs / sum;
				this._calcSizes();
			}
		} else {
			this._parent._removeChild(this, false);
		}
	};
	prototype._insertChild = function (child, refChild) {
		if (refChild == null) {
			this._appendChild(child);
			return;
		}
		base._insertChild.call(this, child, refChild);
		this._insertSplitter(child._index, refChild._element);
	};
	
	prototype._calcSizes = function () {
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i]._size = this._sizes[i] / this._remSize;
		}
	};
	
	prototype._divideSizes = function (size) {
		if (size < 0) {
			this._remSize = 0;
			if (!this._collapse) {
				this._collapse = true;
				this._addClass(COLLAPSE_NAME);
			}
		} else {
			this._remSize = size;
			if (this._collapse) {
				this._collapse = false;
				this._removeClass(COLLAPSE_NAME);
			}
		}
		var length = this._children.length;
		this._sizes.length = length;
		
		var sum = .0; var prev = 0;
		for (var i = 0; i < length; i++) {
			sum += this._children[i]._size;
			var pos = Math.round(this._remSize * sum);
			this._sizes[i] = pos - prev;
			prev = pos;
		}
	};
	prototype._onresize = function (width, height) {
		this._setSize(width, height);
		var sum = Splitter._SIZE * this._splitters.length;
		var i, length = this._children.length;
		if (this._horizontal) {
			this._divideSizes(width - sum);
			for (i = 0; i < length; i++) {
				this._children[i]._onresize(this._sizes[i], height);
			}
		} else {
			this._divideSizes(height - sum);
			for (i = 0; i < length; i++) {
				this._children[i]._onresize(width, this._sizes[i]);
			}
		}
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['horizontal'] = this._horizontal;
		json['size'] = this._size;
		json['type'] = Pane._TYPE;
		return json;
	};
	
	return Pane;
})(PaneBase);


var Contents = (function (Base) {
	
	var COVER_NAME    = NAME_PREFIX + 'cover';
	var CONTENTS_NAME = NAME_PREFIX + 'contents';
	
	function Contents() {
		Base.call(this);
		var self = this;
		
		this._tabstrip = new TabStrip(this);
		
		// DOM
		var cover = createDiv(COVER_NAME);
		cover.onmousedown = function () {
			self._activate();
			return false;
		};
		
		this._body = createDiv(CONTENTS_NAME);
		this._body.appendChild(cover);
		
		this._element.appendChild(this._tabstrip._element);
		this._element.appendChild(this._body);
	}
	var base = Base.prototype;
	var prototype = inherit(Contents, base);
	
	prototype._appendChild = function (content, pauseLayout) {
		base._appendChild.call(this, content);
		this._tabstrip._appendTab(content._tab);
		
		if (pauseLayout) return;
		this._setTabSize();
	};
	prototype._insertChild = function (content, refChild) {
		if (refChild == null) {
			this._appendChild(content, true);
			return;
		}
		this._tabstrip._insertTab(content._tab, refChild._tab);
		base._insertChild.call(this, content, refChild);
	};
	prototype._removeChild = function (content) {
		this._tabstrip._removeTab(content._tab);
		base._removeChild.call(this, content);
		
		if (this._children.length) this._setTabSize();
	};
	
	prototype._moveChild = function (index, to) {
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
	
	prototype._calcRect = function () {
		this._cRect = this._getRect();
	};
	prototype._getChild = function (cPoint) {
		if (this._cRect._contains(cPoint)) return this;
		return null;
	};
	prototype._deleteRect = function () {
		delete this._cRect;
	};
	
	prototype._deactivateAll = function () {
		var length = this._children.length;
		for (var i = 0; i < length; i++) {
			this._children[i]._deactivation();
		}
	};
	
	prototype._onStripDragStart = function () { };
	prototype._onStripDrag = function (delta) { };
	prototype._onStripDrop = function () { };
	
	prototype._fromJSON = function (container, json) {
		var length = json['children'].length;
		for (var i = 0; i < length; i++) {
			var child = json['children'][i];
			var content = Content._fromJSON(container, child);
			this._appendChild(content, true);
		}
		if (length) {
			var active = this._children[json['active']];
			this._activateChild(active);
		}
	};
	
	return Contents;
})(Activator);

var Main = (function (Base) {
	
	function Main() {
		Base.call(this);
	}
	var base = Base.prototype;
	var prototype = inherit(Main, base);
	
	Main._TYPE = 'main';
	
	Main._fromJSON = function (container, json) {
		var main = new Main();
		main._fromJSON(container, json);
		return main;
	};
	
	var MIN_SIZE = new Size(TabStrip._MAIN, TabStrip._MAIN);
	var TAB_SIZE = 120; // px const
	
	prototype._className += 'main';
	
	prototype._getMinSize = function () {
		return MIN_SIZE;
	};
	prototype._onresize = function (width, height) {
		this._setSize(width, height);
		this._width = width;
		this._setTabSize();
	};
	prototype._setTabSize = function () {
		this._tabstrip._onresize(this._width, TAB_SIZE, 0);
	};
	
	prototype._getMain = function () {
		return this;
	};
	
	prototype.toJSON = function () {
		var children = []; var active = 0;
		
		if (this._active) {
			var index = this._active._index;
			var length = this._children.length;
			for (var i = 0; i < length; i++) {
				var child = this._children[i];
				if (child._html) {
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
			'type': Main._TYPE
		};
	};
	
	return Main;
})(Contents);

var Sub = (function (Base) {
	
	function Sub() {
		Base.call(this);
	}
	var base = Base.prototype;
	var prototype = inherit(Sub, base);
	
	Sub._TYPE = 'sub';
	
	Sub._fromJSON = function (container, json) {
		var sub = new Sub();
		sub._fromJSON(container, json);
		return sub;
	};
	
	var TAB_SIZE = 112; // px const
	
	function max(delta, rect) {
		return delta._max(new Vector(
			Frame._MIN_R - rect._right(),
			Edge._SIZE   - rect._top));
	}
	
	prototype._className += 'sub';
	
	prototype._detached = null;
	
	prototype._detachChild = function (content, i) {
		if (i == this._children.length - 1) {
			if (i == content._index) i--;
		} else {
			if (i >= content._index) i++;
		}
		this._active = null;
		this._activateChild(this._children[i]);
		this._removeChild(content);
		
		var sub = new Sub();
		sub._appendChild(content, true);
		sub._activateChild(content);
		return sub;
	};
	
	prototype._openFloat = function (container, rect, delta) {
		var frame = new Frame(this);
		var d = max(delta, rect);
		frame._rect = rect._plus(d)._max(TabStrip._HEIGHT);
		
		container._floats._appendChild(frame);
		frame._activate();
		return d;
	};
	
	prototype._onStripDragStart = function () {
		this._tabstrip._addGrabbingClass();
		this._tabstrip._container._guide._ondragstart(this);
	};
	prototype._onStripDrag = function (delta) {
		var container = this._tabstrip._container;
		
		if (this._parent instanceof Frame) {
			var d = max(delta, this._parent._rect);
			this._parent._move(d);
			
			container._guide._ondrag();
			return d;
		}
		
		var rect = this._getRectOf(container)._round();
		this._parent._removeChild(this, false);
		container._layout();
		this._unsetSize();
		return this._openFloat(container, rect, delta);
	};
	prototype._onStripDrop = function () {
		if (this._detached) {
			this._detached._ondrop();
			delete this._detached;
			this._setTabSize();
		}
		this._tabstrip._removeGrabbingClass();
		this._tabstrip._container._guide._ondrop();
	};
	
	prototype._removeChild = function (content) {
		base._removeChild.call(this, content);
		
		if (this._children.length) return;
		var container = this._getContainer();
		this._parent._removeChild(this, false);
		container._layout();
	};
	
	prototype._onresize = function (width, height) {
		this._setSize(width, height);
		this._layout(width);
	};
	prototype._layout = function (width) {
		this._width = width;
		this._setTabSize();
	};
	prototype._setTabSize = function () {
		if (this._detached) return;
		this._tabstrip._onresize(
			this._width, TAB_SIZE, TabStrip._HEIGHT);
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['active'] = this._active._index;
		if (this._parent instanceof PaneBase) {
			json['size'] = this._size;
			json['type'] = Sub._TYPE;
		}
		return json;
	};
	
	return Sub;
})(Contents);


var Content = (function (Base) {
	
	var DATA_PREFIX = 'data-' + NAME_PREFIX;
	var TITLE_NAME = DATA_PREFIX + 'title';
	var FIXED_NAME = DATA_PREFIX + 'fixed';
	
	function Content(iframe, options) {
		Base.call(this);
		var self = this;
		
		this._iframe = iframe;
		
		this._html = options instanceof Option;
		if (this._html) {
			this['id'] = options._value;
			options = null;
		}
		
		var t = Option._get(options, 'title');
		this._title = t ? t._value : iframe.getAttribute(TITLE_NAME);
		
		var f = Option._get(options, 'fixed');
		var fixed = f ? f._value : iframe.hasAttribute(FIXED_NAME);
		
		this['hidden'] = true;
		
		this._tab = new Tab(this);
		this['setFixed'](fixed);
		
		this._isIframe = iframe.tagName == 'IFRAME';
		// DOM
		if (this._isIframe && iframe.onload == null) {
			iframe.onload = function () {
				self._updateTitle();
			};
		}
		this._body.appendChild(iframe);
	}
	var base = Base.prototype;
	var prototype = inherit(Content, base);
	
	Content._fromJSON = function (container, json) {
		return container._contents[json['id']];
	};
	
	prototype._className += 'content';
	
	prototype['id'] = null;
	
	prototype['onvisibilitychange'] = null;
	prototype['onclose'] = null;
	
	prototype['setTitle'] = function (title) {
		this._title = title;
		this._updateTitle();
	};
	prototype._getTitle = function () {
		if (this._title) return this._title;
		var title;
		if (this._isIframe) {
			try {
				title = this._iframe.contentDocument.title;
				if (title) return title;
			} catch (_) { }
			title = this['id'] || this._iframe.src;
		} else {
			title = this['id'];
		}
		return title || '';
	};
	prototype._updateTitle = function () {
		this._tab._setTitle(this._getTitle());
	};
	
	prototype['setFixed'] = function (fixed) {
		this._tab._setFixed(fixed);
	};
	
	prototype._setHidden = function (hidden) {
		if (hidden == this['hidden']) return;
		this['hidden'] = hidden;
		
		if (isFunction(this['onvisibilitychange'])) {
			try {
				this['onvisibilitychange']();
			} catch (_) { }
		}
	};
	
	prototype._onActivate = function () {
		this._parent._activateChild(this);
	};
	prototype._activation = function () {
		this._addActiveClass();
		this._tab._addActiveClass();
		this._setHidden(false);
	};
	prototype._deactivation = function () {
		this._removeActiveClass();
		this._tab._removeActiveClass();
		this._setHidden(true);
	};
	
	prototype['close'] = function () {
		if (isFunction(this['onclose'])) {
			try {
				if (this['onclose']() == false) {
					this._activate();
					return;
				}
			} catch (_) { }
		}
		this._deactivation();
		this._parent._removeChild(this);
	};
	
	prototype['isClosed'] = function () {
		return !this._getContainer();
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json['id'] = this['id'];
		return json;
	};
	
	return Content;
})(Layout);


return (function () {
	
	function DryDock(element) {
		var container = new Container(element);
		
		this['layout'] = container;
		this['contents'] = container._contents;
		
		addEventListener('resize', function () {
			container['onresize']();
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
	
	var _DIFF = new Vector(TabStrip._HEIGHT, TabStrip._HEIGHT);
	
	// function c(size, rect, dimension) {
	// 	return (size[dimension] - rect[dimension]) / 2;
	// }
	
	function test(children, rect) {
		var length = children.length;
		for (var i = 0; i < length; i++) {
			var child = children[i];
			if (child._rect._equals(rect)) return true;
		}
		return false;
	}
	function move(children, rect, size) {
		while (test(children, rect)) {
			var diff = new Vector(
				size._width  - rect._right(),
				size._height - rect._bottom()
			)._max(Vector._ZERO)._min(_DIFF);
			
			if (diff._equals(Vector._ZERO)) break;
			rect = rect._plus(diff);
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
			var main = this['layout']._getMain();
			main._appendChild(content, false);
		}
		content._activate();
	};
	prototype['openSub'] = function (content, rect) {
		if (content['isClosed']()) {
			var r = rect == null ? new Rect : Rect._from(rect);
			var s = this['layout']._cSize;
			
			if (!r._width ) r._width  = 300;
			if (!r._height) r._height = 200;
			if (r._top  == null) r._top  = (s._height - r._height) / 2;
			if (r._left == null) r._left = (s._width  - r._width)  / 2;
			
			r = move(this['layout']._floats._children,
				r._round(), s._shrink(Edge._SIZE));
			
			var sub = new Sub();
			sub._appendChild(content, true);
			sub._activateChild(content);
			sub._openFloat(this['layout'], r, Vector._ZERO);
			return;
		}
		content._activate();
	};
	
	prototype['init'] = function () {
		this['layout']._init();
		this['layout']._setChild(new Main());
		this['layout']._activate();
		this['layout']['onresize']();
	};
	
	prototype['serialize'] = function () {
		return JSON.stringify(this['layout']);
	};
	prototype['restore'] = function (jsonString) {
		this['layout']._init();
		this['layout']._fromJSON(JSON.parse(jsonString));
		this['layout']._activate();
		this['layout']['onresize']();
	};
	
	return DryDock;
})();

})(document, Node, Math, JSON);
