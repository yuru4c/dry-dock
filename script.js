var DryDock = (function ($, Node, Math, JSON) {

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
		this.x = x;
		this.y = y;
	}
	var prototype = Vector.prototype;
	
	Vector.ZERO = new Vector(0, 0);
	
	Vector.from = function (event) {
		return new Vector(
			event.clientX,
			event.clientY);
	};
	
	prototype.plus  = function (vector) {
		return new Vector(
			this.x + vector.x,
			this.y + vector.y);
	};
	prototype.minus = function (vector) {
		return new Vector(
			this.x - vector.x,
			this.y - vector.y);
	};
	prototype.of = function (rect) {
		return new Vector(
			this.x - rect.left,
			this.y - rect.top);
	};
	
	prototype.min = function (vector) {
		return new Vector(
			Math.min(this.x, vector.x),
			Math.min(this.y, vector.y));
	};
	prototype.max = function (vector) {
		return new Vector(
			Math.max(this.x, vector.x),
			Math.max(this.y, vector.y));
	};
	
	prototype.round = function () {
		return new Vector(
			Math.round(this.x),
			Math.round(this.y));
	};
	prototype.square = function () {
		return this.x * this.x +
		       this.y * this.y;
	};
	
	prototype.equals = function (vector) {
		return this.x == vector.x
		    && this.y == vector.y;
	};
	
	return Vector;
})();

var Size = (function () {
	function Size(width, height) {
		this.width  = width;
		this.height = height;
	}
	var prototype = Size.prototype;
	
	Size.from = function (element) {
		return new Size(
			element.clientWidth,
			element.clientHeight);
	};
	
	prototype.max = function (size) {
		return new Size(
			Math.max(this.width,  size.width),
			Math.max(this.height, size.height));
	};
	
	prototype.shrink = function (value) {
		return new Size(
			this.width  - value,
			this.height - value);
	};
	
	return Size;
})();

var Rect = (function () {
	
	function Rect(top, left, width, height) {
		this.top    = top;
		this.left   = left;
		this.width  = width;
		this.height = height;
	}
	var prototype = Rect.prototype;
	
	Rect.from = function (rect) {
		return new Rect(
			rect.top,
			rect.left,
			rect.width,
			rect.height);
	};
	
	prototype.plus = function (vector) {
		return new Rect(
			this.top  + vector.y,
			this.left + vector.x,
			this.width, this.height);
	};
	prototype.of = function (rect) {
		return new Rect(
			this.top  - rect.top,
			this.left - rect.left,
			this.width, this.height);
	};
	
	prototype.max = function (value) {
		return new Rect(
			this.top, this.left,
			Math.max(this.width,  value),
			Math.max(this.height, value));
	};
	prototype.round = function () {
		return new Rect(
			Math.round(this.top),
			Math.round(this.left),
			Math.round(this.width),
			Math.round(this.height));
	};
	
	prototype.right = function () {
		return this.left + this.width;
	};
	prototype.bottom = function () {
		return this.top + this.height;
	};
	
	prototype.contains = function (vector) {
		return this.left <= vector.x && vector.x < this.right()
		    && this.top  <= vector.y && vector.y < this.bottom();
	};
	
	prototype.equals = function (rect) {
		return this.top    == rect.top
		    && this.left   == rect.left
		    && this.width  == rect.width
		    && this.height == rect.height;
	};
	
	return Rect;
})();


var EdgeDef = (function () {
	
	function EdgeDef(className) {
		this.className = NAME_PREFIX + className;
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
	
	EdgeDef.forEach = function (object) {
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
		this.horizontal = horizontal;
		this.order = order;
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
		this.i = i;
		this.diff = diff;
	}
	function Insert(size, tSize, t, n) {
		this.size = size;
		this.tSize = tSize;
		this.t = t;
		this.n = n;
	}
	
	prototype.sizeOf = function (rect) {
		var size = this.horizontal ? rect.width : rect.height;
		return size - Splitter.SIZE;
	};
	
	prototype.calcInsert = function (target) {
		var parent = target.parent;
		var ti = target.index;
		var ni = this.order ? ti + 1 : ti - 1;
		
		var tSize = target.size;
		var nSize = parent.children[ni].size;
		var sSize = tSize + nSize;
		
		var tcSize = parent.sizes[ti];
		var ncSize = parent.sizes[ni];
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
			rect.width  - GuideButton.DIFF,
			rect.height - GuideButton.DIFF);
	}
	
	ButtonPos.center = function (rect) {
		return new Vector(
			(rect.width  - GuideButton.SIZE) / 2,
			(rect.height - GuideButton.SIZE) / 2);
	};
	
	return ButtonPos;
})();


var Pointer = (function () {
	
	function Pointer(container, event, draggable) {
		this.container = container;
		
		this.point = Vector.from(event);
		this.diff  = Vector.ZERO;
		this.first = true;
		
		this.hardDrag = draggable.hardDrag;
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
		var point = Vector.from(event);
		if (this.hardDrag) {
			var sq = point.minus(this.point).square();
			if (sq < THRESHOLD) return;
			this.hardDrag = false;
		}
		var diff = point.minus(this.point);
		this.point = point;
		
		if (this.first) {
			this.dragging.ondragstart();
			this.first = false;
		}
		var sum = this.diff.plus(diff), arg = sum.round();
		var ret = this.dragging.ondrag(arg);
		this.diff = sum.minus(ret || arg);
	};
	prototype.mouseup = function () {
		this.dragging.ondrop();
		this.deleteContainer();
	};
	
	return Pointer;
})();

var Option = (function () {
	
	function Option(value) {
		this.value = value;
	}
	
	Option.get = function (options, key) {
		if (options != null && key in options) {
			return new Option(options[key]);
		}
		return null;
	};
	
	return Option;
})();


var Model = (function () {
	
	function Model(className) {
		var prefixed = NAME_PREFIX + className;
		this.classList = [prefixed];
		
		this.element = $.createElement(this.tagName);
		this.element.className = prefixed;
		
		this.body = this.element;
	}
	var prototype = Model.prototype;
	
	function indexOf(classList, className) {
		var length = classList.length;
		for (var i = 1; i < length; i++) {
			if (classList[i] == className) return i;
		}
		return 0;
	}
	
	prototype.tagName = 'div';
	
	prototype.setSize = function (width, height) {
		var style = this.element.style;
		style.width  = width  + 'px';
		style.height = height + 'px';
	};
	prototype.unsetSize = function () {
		var style = this.element.style;
		style.width = style.height = '';
	};
	
	prototype.setPos = function (top, left) {
		var style = this.element.style;
		style.top  = top  + 'px';
		style.left = left + 'px';
	};
	
	prototype.setRect = function (rect) {
		this.setPos (rect.top,   rect.left);
		this.setSize(rect.width, rect.height);
	};
	
	prototype.setWidth = function (width) {
		this.element.style.width = width + 'px';
	};
	prototype.setLeft = function (left) {
		this.element.style.left = left + 'px';
	};
	prototype.unsetLeft = function () {
		this.element.style.left = '';
	};
	
	prototype.applyClass = function () {
		this.element.className = this.classList.join(' ');
	};
	prototype.addClass = function (className) {
		if (indexOf(this.classList, className)) return;
		this.classList.push(className);
		this.applyClass();
	};
	prototype.removeClass = function (className) {
		var index = indexOf(this.classList, className);
		if (index) {
			this.classList.splice(index, 1);
			this.applyClass();
		}
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
	prototype.parent = null;
	
	prototype.onActivate = function () { };
	prototype.activate = function () {
		this.onActivate();
		this.parent.activate();
	};
	
	prototype.getRect = function () {
		var element = this.bodyRect ? this.body : this.element;
		return Rect.from(element.getBoundingClientRect());
	};
	
	prototype.addActiveClass = function () {
		this.addClass(ACTIVE_NAME);
	};
	prototype.removeActiveClass = function () {
		this.removeClass(ACTIVE_NAME);
	};
	
	prototype.getContainer = function () {
		return this.parent ? this.parent.getContainer() : null;
	};
	
	return Control;
})(Model);

var Draggable = _(function (Base, base) {
	
	function Draggable(className, parent) {
		Base.call(this, className);
		var self = this;
		
		this.parent = parent;
		
		function mousedown(event) {
			var target = event.target;
			if (target == this || target == self.body) {
				if (event.button) self.activate();
				else {
					self.getContainer().mousedown(event, self);
					self.onmousedown();
				}
				return false;
			}
		}
		this.element.onmousedown  = mousedown;
		this.element.ontouchstart = toTouch(mousedown);
	}
	var prototype = inherit(Draggable, base);
	
	var GRABBING_NAME = NAME_PREFIX + 'grabbing';
	
	prototype.hardDrag = false;
	prototype.cursor = '';
	
	prototype.setCursor = function (cursor) {
		this.cursor = cursor;
		this.element.style.cursor = cursor;
	};
	
	prototype.addGrabbingClass = function () {
		this.addClass(GRABBING_NAME);
	};
	prototype.removeGrabbingClass = function () {
		this.removeClass(GRABBING_NAME);
	};
	
	prototype.onmousedown = function () {
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
		
		this.index = index;
		this.setCursor(pane.horizontal ? 'ew-resize' : 'ns-resize');
	}
	var prototype = inherit(Splitter, base);
	
	Splitter.SIZE = 6; // px const
	
	prototype.onmousedown = function () {
		base.onmousedown.call(this);
		this.addGrabbingClass();
	};
	prototype.ondragstart = function () {
		this.parent.onSplitterDragStart(this);
	};
	prototype.ondrag = function (delta) {
		var d = this.parent.onSplitterDrag(this.index,
			this.parent.horizontal ? delta.x : delta.y);
		
		if (d) this.container.layout();
		return this.parent.horizontal ?
			new Vector(d, delta.y) :
			new Vector(delta.x, d);
	};
	prototype.ondrop = function () {
		this.parent.onSplitterDrop();
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
		this.body.appendChild(tab.element);
	};
	prototype.insertTab = function (tab, refTab) {
		tab.tabstrip = this;
		this.tabs.splice(refTab.index(), 0, tab);
		this.body.insertBefore(tab.element, refTab.element);
	};
	prototype.removeTab = function (tab) {
		delete tab.tabstrip;
		this.tabs.splice(tab.index(), 1);
		this.body.removeChild(tab.element);
	};
	
	prototype.onTabDrag = function (tab, x) {
		var index = tab.index(), l = this.tabs.length;
		
		var toIndex = index + Math.round(x / this.tabSize);
		if (toIndex <  0) toIndex = 0;
		if (toIndex >= l) toIndex = l - 1;
		if (toIndex == index) return x;
		
		var to = this.tabs[toIndex].element;
		this.tabs.splice(index, 1);
		this.tabs.splice(toIndex, 0, tab);
		
		this.body.insertBefore(tab.element,
			toIndex < index ? to : to.nextSibling);
		
		this.parent.moveChild(index, toIndex);
		this.parent.setTabSize();
		return x - this.tabSize * (toIndex - index);
	};
	
	prototype.ondragstart = function () {
		this.parent.onStripDragStart();
	};
	prototype.ondrag = function (delta) {
		return this.parent.onStripDrag(delta);
	};
	prototype.ondrop = function () {
		this.parent.onStripDrop();
	};
	
	prototype.onresize = function (size, tabSize, margin) {
		var length = this.tabs.length;
		var rem = margin < size ? size - margin : 0;
		if (tabSize * length > rem) {
			this.tabSize = rem / length;
		} else {
			this.tabSize = tabSize;
		}
		var sum = 0, prev = 0;
		for (var i = 0; i < length; i++) {
			sum += this.tabSize;
			var pos = Math.round(sum);
			this.tabs[i].setWidth(pos - prev);
			prev = pos;
		}
	};
	
	return TabStrip;
})(Draggable);

var Tab = _(function (Base, base) {
	
	function Tab(content) {
		Base.call(this, 'tab', content);
		
		var title = content.getTitle();
		this.textNode = $.createTextNode(title);
		
		this.body = $.createElement('span');
		this.body.className = NAME_PREFIX + 'title';
		this.body.appendChild(this.textNode);
		
		var close = new Close(this, content);
		
		this.element.title = title;
		this.element.appendChild(this.body);
		this.element.appendChild(close.element);
	}
	var prototype = inherit(Tab, base);
	
	var FIXED_NAME = NAME_PREFIX + 'fixed';
	
	function Drag(tab) {
		var tabstrip = tab.tabstrip;
		this.contents = tabstrip.parent;
		this.detachable = tab.parent.html; // this.contents instanceof Sub;
		
		if (this.detachable) {
			this.diff = Vector.ZERO;
			this.i = tab.index();
			
			this.size = tabstrip.tabSize;
			this.min = -this.size;
			this.max = this.contents.width -
				this.size * (tabstrip.tabs.length - 1);
		}
		this.x = 0;
	}
	
	prototype.hardDrag = true;
	prototype.tabstrip = null;
	
	prototype.index = function () {
		return this.parent.index;
	};
	
	prototype.setTitle = function (title) {
		this.element.title = title;
		this.textNode.data = title;
	};
	prototype.setFixed = function (fixed) {
		if (fixed) {
			this.addClass(FIXED_NAME);
		} else {
			this.removeClass(FIXED_NAME);
		}
	};
	
	prototype.detach = function (drag) {
		var container = this.container;
		this.removeGrabbingClass();
		this.setLeft(Math.round(drag.size * drag.i));
		
		var contents = drag.contents;
		var rect = contents.getRectOf(container).round();
		var sub = contents.detachChild(this.parent, drag.i);
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
		drag.x = this.tabstrip.onTabDrag(this, drag.x + delta.x);
		if (drag.detachable) {
			var diff = drag.diff;
			drag.diff = diff.plus(delta);
			if (drag.x < drag.min || drag.max <= drag.x ||
				Math.abs(drag.diff.y) >= TabStrip.HEIGHT) {
				
				return this.detach(drag).minus(diff);
			}
		}
		this.setLeft(drag.x);
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
		
		this.content = content;
		
		this.element.title = '';
		this.body.appendChild($.createTextNode('×'));
	}
	var prototype = inherit(Close, base);
	
	var CANCEL_NAME = NAME_PREFIX + 'cancel';
	
	function Drag(rect) {
		this.rect = rect;
		this.hovering = true;
	}
	
	prototype.tagName = 'a';
	
	prototype.onmousedown = function () {
		this.drag = new Drag(this.getRect());
		this.addActiveClass();
		blur();
	};
	prototype.ondrag = function () {
		var drag = this.drag;
		var point = this.container.pointer.point;
		
		var hovering = drag.rect.contains(point);
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
			this.content.close();
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
		
		this.addClass(v.className);
		this.addClass(h.className);
		this.setCursor(cursor);
	}
	var prototype = inherit(Edge, base);
	
	Edge.SIZE = 2; // px const
	
	prototype.ondrag = function (delta) {
		var dx = delta.x, dy = delta.y;
		
		var rect = this.parent.rect;
		var mw = rect.width  - TabStrip.HEIGHT;
		var mh = rect.height - TabStrip.HEIGHT;
		
		switch (this.v) {
			case EdgeDef.TOP:
			var t = Edge.SIZE - rect.top;
			if (dy > mh) dy = mh;
			if (dy <  t) dy =  t;
			rect.top    += dy;
			rect.height -= dy;
			break;
			
			case EdgeDef.BOTTOM:
			if (dy < -mh) dy = -mh;
			rect.height += dy;
			break;
		}
		switch (this.h) {
			case EdgeDef.LEFT:
			if (dx > mw) dx = mw;
			rect.left  += dx;
			rect.width -= dx;
			break;
			
			case EdgeDef.RIGHT:
			var r = Frame.MIN_R - rect.right();
			if (dx < -mw) dx = -mw;
			if (dx <   r) dx =   r;
			rect.width += dx;
			break;
		}
		this.parent.layout();
		
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
	
	GuideControl.HEIGHT_PX = TabStrip.HEIGHT + 'px';
	GuideControl.MAIN_PX   = TabStrip.MAIN   + 'px';
	
	prototype.hide = function () {
		this.element.style.display = 'none';
	};
	prototype.show = function () {
		this.element.style.display = '';
	};
	
	prototype.setDisable = function (disable) {
		this.disable = disable;
		if (disable) this.hide(); else this.show();
	};
	
	return GuideControl;
})(Model);

var GuideBase = _(function (Base, base) {
	
	function GuideBase(className, container) {
		Base.call(this, className, container);
		
		this.area = new GuideArea(container);
		this.top    = new GuideButton(container, ButtonDef.TOP);
		this.right  = new GuideButton(container, ButtonDef.RIGHT);
		this.bottom = new GuideButton(container, ButtonDef.BOTTOM);
		this.left   = new GuideButton(container, ButtonDef.LEFT);
		
		this.hide();
		this.body.appendChild(this.area.element);
		this.body.appendChild(this.top   .element);
		this.body.appendChild(this.right .element);
		this.body.appendChild(this.bottom.element);
		this.body.appendChild(this.left  .element);
	}
	var prototype = inherit(GuideBase, base);
	
	prototype.droppable = null;
	
	prototype.getButton = function (vector) {
		if (this.top   .hitTest(vector)) return this.top;
		if (this.right .hitTest(vector)) return this.right;
		if (this.bottom.hitTest(vector)) return this.bottom;
		if (this.left  .hitTest(vector)) return this.left;
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
				this.area.show();
			} else {
				this.area.hide();
			}
		}
	};
	
	prototype.onleave = function () {
		this.setDroppable(null);
		this.hide();
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
		
		this.child = new GuidePane(container);
		this.body.appendChild(this.child.element);
	}
	var prototype = inherit(Guide, base);
	
	function Drag(contents) {
		this.contents = contents;
		this.target = null;
		this.first = true;
	}
	
	prototype.drag = null;
	
	prototype.ondragstart = function (contents) {
		this.drag = new Drag(contents);
	};
	prototype.ondrag = function () {
		var drag = this.drag;
		if (drag.first) {
			this.container.calcRect();
			var pos = new ButtonPos(this.container.cRect);
			
			this.top   .setPos(pos.f.y, pos.c.x);
			this.right .setPos(pos.c.y, pos.l.x);
			this.bottom.setPos(pos.l.y, pos.c.x);
			this.left  .setPos(pos.c.y, pos.f.x);
			
			this.show();
			drag.first = false;
		}
		var point = this.container.pointer.point;
		
		var target = this.container.getChild(point);
		if (target != drag.target) {
			if (drag.target) {
				this.child.setDroppable(null);
			}
			drag.target = target;
			if (target) {
				this.child.onenter(target);
			} else {
				this.child.onleave();
			}
		}
		var relative;
		var top = null;
		if (target) {
			relative = point.of(target.cRect);
			top = this.child.getButton(relative);
		}
		
		var button = top ? null :
			this.getButton(point.of(this.container.cRect));
		this.setDroppable(button);
		
		if (target) {
			this.child.ondrag(relative, top, button);
		}
	};
	
	prototype.enter = function (button) {
		this.area.setOuterArea(button.def, this.container.cRect);
	};
	
	prototype.ondrop = function () {
		var drag = this.drag;
		if (drag) {
			if (drag.target) {
				this.child.drop(drag.contents, drag.target);
			}
			this.drop(drag.contents, this.container);
		}
		base.ondrop.call(this);
		this.child.ondrop();
		this.container.deleteRect();
	};
	
	return Guide;
})(GuideBase);

var GuidePane = _(function (Base, base) {
	
	function GuidePane(container) {
		Base.call(this, 'guidepane', container);
		
		this.center = new GuideButton(container, ButtonDef.CENTER);
		this.guidestrip = new GuideStrip(container);
		this.body.appendChild(this.center.element);
		this.body.appendChild(this.guidestrip.element);
	}
	var prototype = inherit(GuidePane, base);
	
	function Drag(target, container) {
		this.target = target;
		
		this.rect = target.cRect.of(container.cRect);
		this.pane = target.parent instanceof Pane;
		this.main = target instanceof Main;
	}
	
	prototype.onenter = function (target) {
		var drag = new Drag(target, this.container);
		this.drag = drag;
		
		this.setRect(drag.rect);
		
		var c = ButtonPos.center(drag.rect);
		this.top   .setPos(c.y - GuideButton.DIFF, c.x);
		this.right .setPos(c.y, c.x + GuideButton.DIFF);
		this.bottom.setPos(c.y + GuideButton.DIFF, c.x);
		this.left  .setPos(c.y, c.x - GuideButton.DIFF);
		this.center.setPos(c.y, c.x);
		
		var frame = target.parent instanceof Frame;
		this.top   .setDisable(frame);
		this.right .setDisable(frame);
		this.bottom.setDisable(frame);
		this.left  .setDisable(frame);
		// this.center.setDisable(drag.main);
		
		this.show();
	};
	prototype.ondrag = function (vector, button, hit) {
		if (button || hit/* || this.drag.main */) {
			this.setDroppable(button);
			return;
		}
		if (vector.y < TabStrip.HEIGHT) {
			this.setDroppable(this.guidestrip);
			this.guidestrip.ondrag(vector);
			return;
		}
		this.setDroppable(null);
	};
	
	prototype.enter = function (droppable) {
		var drag = this.drag;
		var target = drag.target;
		
		if (droppable == this.guidestrip) {
			this.area.setStripArea(drag.main);
			droppable.enter(target, drag.main);
			return;
		}
		var def = droppable.def;
		if (drag.main) {
			this.area.setMainArea(def, drag.rect);
			return;
		}
		if (drag.pane && def != ButtonDef.CENTER) {
			var pane = target.parent;
			if (pane.horizontal == def.horizontal) {
				var end = def.order ? pane.children.length - 1 : 0;
				if (target.index != end) {
					this.area.setInsertArea(def, target);
					return;
				}
			}
		}
		this.area.setArea(def, drag.rect);
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
		var parent = target.parent;
		contents.parent.removeChild(contents, true);
		this.drop(contents, target);
		
		target.activate();
		this.container.layout();
		if (parent instanceof Frame) parent.layout();
	};
	
	prototype.sizeOf = function (layout, divisor) {
		var size = this.def.sizeOf(layout.cRect);
		return Math.floor(size / divisor);
	};
	prototype.test = function (layout) {
		return layout instanceof Dock &&
			layout.horizontal == this.def.horizontal;
	};
	prototype.newDock = function (child, pane) {
		var dock = new Dock(this.def.horizontal);
		dock.setChild(child);
		
		var dockpane = this.def.order ? dock.after : dock.before;
		dockpane.appendChild(pane);
		
		return dock;
	};
	
	prototype.outer = function (contents, container, child) {
		contents.size = this.sizeOf(child, ButtonDef.OUTER_DIV);
		if (this.test(child)) {
			if (this.def.order) {
				child.after.appendChild(contents);
			} else {
				child.before.prependChild(contents);
			}
		} else {
			container.removeChild();
			container.setChild(this.newDock(child, contents));
		}
	};
	prototype.dockPane = function (contents, target, parent) {
		contents.size = this.sizeOf(target, ButtonDef.MAIN_DIV);
		if (this.test(parent)) {
			if (this.def.order) {
				parent.after.prependChild(contents);
			} else {
				parent.before.appendChild(contents);
			}
		} else {
			parent.removeChild();
			parent.setChild(this.newDock(target, contents));
		}
	};
	
	prototype.newPane = function (contents, target, parent) {
		var ref = parent.children[target.index + 1];
		parent.removeChild(target, true);
		
		var pane = new Pane(this.def.horizontal);
		pane.size = target.size;
		contents.size = target.size = .5;
		
		if (this.def.order) {
			pane.appendChild(target);
			pane.appendChild(contents);
		} else {
			pane.appendChild(contents);
			pane.appendChild(target);
		}
		parent.insertChild(pane, ref);
	};
	prototype.splitPane = function (contents, target, parent) {
		var size = parent.sizes[target.index];
		parent.remSize -= Splitter.SIZE;
		parent.calcSizes();
		
		var half = (size - Splitter.SIZE) / (parent.remSize * 2);
		contents.size = half;
		target  .size = half;
		
		parent.insertChild(contents, this.def.order ?
			parent.children[target.index + 1] : target);
	};
	prototype.insertPane = function (contents, target, parent) {
		var ins = this.def.calcInsert(target);
		var i = this.def.order ? ins.n.i : ins.t.i;
		
		parent.sizes[ins.t.i] -= ins.t.diff;
		parent.sizes[ins.n.i] -= ins.n.diff;
		parent.sizes.splice(i, 0, ins.size);
		
		parent.insertChild(contents, this.def.order ?
			parent.children[ins.t.i + 1] : target);
		
		parent.remSize -= Splitter.SIZE;
		parent.calcSizes();
	};
	
	prototype.mergeTabs = function (contents, target, index) {
		var refChild = target.children[index];
		var children = contents.children;
		var length = children.length;
		for (var i = 0; i < length; i++) {
			target.insertChild(children[i], refChild);
		}
		target.activateChild(contents.active);
	};
	
	return GuideDroppable;
})(GuideControl);

var GuideButton = _(function (Base, base) {
	
	function GuideButton(container, def) {
		Base.call(this, 'guidebutton', container);
		
		this.def = def;
		this.body.appendChild($.createTextNode(def.letter));
	}
	var prototype = inherit(GuideButton, base);
	
	GuideButton.SIZE   = 40; // px const
	GuideButton.MARGIN =  3; // px const
	GuideButton.DIFF = GuideButton.SIZE + GuideButton.MARGIN;
	
	var HOVER_NAME = NAME_PREFIX + 'hover';
	
	prototype.setPos = function (top, left) {
		this.rect = new Rect(top, left,
			GuideButton.SIZE, GuideButton.SIZE);
		base.setPos.call(this, top, left);
	};
	
	prototype.hitTest = function (vector) {
		if (this.disable) return false;
		return this.rect.contains(vector);
	};
	
	prototype.onenter = function () {
		this.addClass(HOVER_NAME);
	};
	prototype.onleave = function () {
		this.removeClass(HOVER_NAME);
	};
	
	prototype.drop = function (contents, target) {
		var parent = target.parent;
		if (this.def == ButtonDef.CENTER) {
			this.mergeTabs(contents, target, -1);
			return;
		}
		if (target == this.container) {
			this.outer(contents, target, target.child);
			this.container.updateMinSize();
			return;
		}
		if (target instanceof Main) {
			this.dockPane(contents, target, parent);
			this.container.updateMinSize();
			return;
		}
		if (parent instanceof Pane &&
			parent.horizontal == this.def.horizontal) {
			
			var end = this.def.order ? parent.children.length - 1 : 0;
			if (target.index == end) {
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
		this.body.appendChild(this.area.element);
	}
	var prototype = inherit(GuideStrip, base);
	
	function Drag(target) {
		this.index = -1;
		this.tabSize = target.tabstrip.tabSize;
		this.length  = target.children.length;
	}
	
	prototype.enter = function (target, main) {
		this.drag = new Drag(target);
		this.element.style.height = main ?
			GuideControl.MAIN_PX :
			GuideControl.HEIGHT_PX;
	};
	
	prototype.onenter = function () {
		this.area.show();
	};
	prototype.onleave = function () {
		this.area.hide();
	};
	prototype.ondrag = function (vector) {
		var drag = this.drag;
		var index = Math.floor(vector.x / drag.tabSize);
		if (index > drag.length) index = drag.length;
		if (index != drag.index) {
			drag.index = index;
			this.area.setTabArea(index, drag.tabSize);
		}
	};
	
	prototype.drop = function (contents, target) {
		this.mergeTabs(contents, target, this.drag.index);
		delete this.drag;
	};
	
	return GuideStrip;
})(GuideDroppable);

var GuideArea = _(function (Base, base) {
	
	function GuideArea(container) {
		Base.call(this, 'guidearea', container);
		
		this.hide();
	}
	var prototype = inherit(GuideArea, base);
	
	// var HEIGHT_PX = TabStrip.HEIGHT + 'px';
	
	prototype.set = function (def, margin, value) {
		var px = value + Splitter.SIZE + 'px';
		var s = this.element.style;
		s.top = s.right = s.bottom = s.left = margin;
		switch (def) {
			case ButtonDef.TOP: s.bottom = px; break;
			case ButtonDef.RIGHT: s.left = px; break;
			case ButtonDef.BOTTOM: s.top = px; break;
			case ButtonDef.LEFT: s.right = px; break;
		}
	};
	
	prototype.setArea = function (def, rect) {
		this.set(def, '0', def.sizeOf(rect) / 2);
	};
	prototype.setMainArea = function (def, rect) {
		var size = def.sizeOf(rect);
		this.set(def, '0', size - size / ButtonDef.MAIN_DIV);
	};
	prototype.setOuterArea = function (def, rect) {
		var size = def.sizeOf(rect) - Container.M2;
		this.set(def, Container.MP,
			size - size / ButtonDef.OUTER_DIV + Container.MARGIN);
	};
	
	prototype.setInsertArea = function (def, target) {
		var ins = def.calcInsert(target);
		this.set(def, '0', ins.tSize - ins.t.diff);
		
		var px = -ins.n.diff + 'px';
		var s = this.element.style;
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
	prototype.setStripArea = function (main) {
		var s = this.element.style;
		s.top = main ? GuideControl.MAIN_PX : GuideControl.HEIGHT_PX;
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
		return this.getRect().of(layout.getRect());
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
		
		this.child = null;
	}
	var prototype = inherit(Single, base);
	
	prototype.setChild = function (child) {
		this.child = child;
		child.parent = this;
		this.body.appendChild(child.element);
	};
	prototype.removeChild = function () {
		delete this.child.parent;
		this.body.removeChild(this.child.element);
		this.child = null;
	};
	
	prototype.calcRect = function () {
		this.cRect = this.getRect();
		this.child.calcRect();
	};
	prototype.deleteRect = function () {
		delete this.cRect;
		this.child.deleteRect();
	};
	
	prototype.deactivateAll = function () {
		this.child.deactivateAll();
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.child = this.child;
		return json;
	};
	
	return Single;
})(Layout);

var Multiple = _(function (Base, base) {
	
	function Multiple(className) {
		Base.call(this, className);
		
		this.children = [];
	}
	var prototype = inherit(Multiple, base);
	
	prototype.appendChild = function (child) {
		child.parent = this;
		child.index = this.children.length;
		this.children.push(child);
		
		this.body.appendChild(child.element);
	};
	prototype.removeChild = function (child) {
		delete child.parent;
		this.children.splice(child.index, 1);
		var length = this.children.length;
		for (var i = child.index; i < length; i++) {
			this.children[i].index = i;
		}
		this.body.removeChild(child.element);
	};
	prototype.insertChild = function (child, refChild) {
		child.parent = this;
		this.children.splice(refChild.index, 0, child);
		var length = this.children.length;
		for (var i = refChild.index; i < length; i++) {
			this.children[i].index = i;
		}
		this.body.insertBefore(child.element, refChild.element);
	};
	
	prototype.calcRect = function () {
		this.cRect = this.getRect();
		var length = this.children.length;
		for (var i = 0; i < length; i++) {
			this.children[i].calcRect();
		}
	};
	prototype.getChild = function (cPoint) {
		if (this.cRect.contains(cPoint)) {
			var length = this.children.length;
			for (var i = 0; i < length; i++) {
				var child = this.children[i].getChild(cPoint);
				if (child) return child;
			}
		}
		return null;
	};
	prototype.deleteRect = function () {
		delete this.cRect;
		var length = this.children.length;
		for (var i = 0; i < length; i++) {
			this.children[i].deleteRect();
		}
	};
	
	prototype.deactivateAll = function () {
		var length = this.children.length;
		for (var i = 0; i < length; i++) {
			this.children[i].deactivateAll();
		}
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.children = this.children;
		return json;
	};
	
	return Multiple;
})(Layout);

var Activator = _(function (Base, base) {
	
	function Activator(className) {
		Base.call(this, className);
		
		this.active = null;
	}
	var prototype = inherit(Activator, base);
	
	prototype.removeChild = function (child) {
		base.removeChild.call(this, child);
		
		if (child == this.active) {
			var length = this.children.length;
			if (length) {
				var index = child.index;
				if (index == length) index = length - 1;
				this.activateChild(this.children[index]);
			} else {
				this.active = null;
			}
		}
	};
	
	prototype.activateChild = function (child) {
		if (child == this.active) return;
		if (this.active) this.active.deactivation();
		this.active = child;
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
		return this.child.getMain();
	};
	
	prototype.fromJSON = function (container, json) {
		var child = json.child;
		switch (child.type) {
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
		this.body    = createDiv('body');
		this.overlay = createDiv('overlay');
		this.floats = new Floats(this);
		this.guide  = new Guide(this);
		
		this.element.appendChild(this.body);
		this.element.appendChild(this.floats.element);
		this.element.appendChild(this.guide.element);
		this.element.appendChild(this.overlay);
		this.element.onmousedown = function (event) {
			if (event.target == this) {
				self.activate();
				return false;
			}
		};
		element.appendChild(this.element);
		
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
		
		this.overlay.style.cursor = draggable.cursor;
		this.addClass(DRAGGING_NAME);
		
		this.element.onmousemove = this.mousemove;
		this.element.onmouseup   = this.mouseup;
		this.element.ontouchmove = this.touchmove;
		this.element.ontouchend  = this.touchend;
	};
	
	prototype.calcRect = function () {
		base.calcRect.call(this);
		this.floats.calcRect();
	};
	prototype.getChild = function (cPoint) {
		if (this.cRect.contains(cPoint)) {
			var child = this.floats.getChild(cPoint);
			if (child) {
				if (child instanceof Frame) return null;
				return child;
			}
			return this.child.getChild(cPoint);
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
		this.cSize = Size.from(this.element);
		if (this.minSize) {
			this.updateSize();
		} else {
			this.updateMinSize();
		}
		this.layout();
	};
	prototype.updateMinSize = function () {
		this.minSize = this.child.getMinSize();
		this.updateSize();
	};
	prototype.updateSize = function () {
		this.size = this.cSize
			.shrink(Container.M2).max(this.minSize);
	};
	prototype.layout = function () {
		this.child.onresize(this.size.width, this.size.height);
	};
	
	prototype.getContainer = function () {
		return this;
	};
	
	prototype.init = function () {
		if (this.child) {
			this.deactivateAll();
			this.removeChild();
			this.minSize = null;
		}
		this.floats.removeAll();
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.floats = this.floats;
		return json;
	};
	prototype.fromJSON = function (json) {
		base.fromJSON.call(this, this, json);
		this.floats.fromJSON(this, json.floats);
	};
	
	return Container;
})(DockBase);

var Floats = _(function (Base, base) {
	
	function Floats(container) {
		Base.call(this, 'floats');
		
		this.parent = container;
	}
	var prototype = inherit(Floats, base);
	
	prototype.appendChild = function (frame) {
		frame.setZ(this.children.length);
		base.appendChild.call(this, frame);
		frame.layout();
	};
	prototype.removeChild = function (frame, pauseLayout) {
		base.removeChild.call(this, frame);
		if (pauseLayout) return;
		
		var length = this.children.length;
		for (var i = frame.index; i < length; i++) {
			this.children[i].setZ(i);
		}
		
		if (length) return;
		this.parent.activate();
	};
	prototype.removeAll = function () {
		for (var i = this.children.length - 1; i >= 0; i--) {
			this.removeChild(this.children[i], true);
		}
	};
	
	prototype.calcRect = function () {
		var length = this.children.length - 1;
		for (var i = 0; i < length; i++) {
			this.children[i].calcRect();
		}
	};
	prototype.getChild = function (cPoint) {
		for (var i = this.children.length - 2; i >= 0; i--) {
			var child = this.children[i].getChild(cPoint);
			if (child) return child;
		}
		return null;
	};
	prototype.deleteRect = function () {
		var length = this.children.length;
		for (var i = 0; i < length; i++) {
			this.children[i].deleteRect();
		}
	};
	
	prototype.activateChild = function (frame) {
		base.activateChild.call(this, frame);
		
		this.children.splice(frame.index, 1);
		this.children.push(frame);
		
		var length = this.children.length;
		for (var i = frame.index; i < length; i++) {
			var child = this.children[i];
			child.index = i;
			child.setZ(i);
		}
	};
	
	prototype.activate = function () { // stop bubbling
		this.parent.activateFloats();
	};
	
	prototype.fromJSON = function (container, json) {
		var length = json.children.length;
		for (var i = 0; i < length; i++) {
			var child = json.children[i];
			var frame = Frame.fromJSON(container, child);
			this.appendChild(frame);
		}
	};
	
	return Floats;
})(Activator);

var Frame = _(function (Base, base) {
	
	function Frame(sub) {
		Base.call(this, 'frame');
		
		// DOM
		this.body = createDiv('fbody');
		this.setChild(sub);
		
		this.element.appendChild(this.body);
		EdgeDef.forEach(this);
	}
	var prototype = inherit(Frame, base);
	
	Frame.MIN_R = Edge.SIZE + TabStrip.HEIGHT;
	
	Frame.fromJSON = function (container, json) {
		var sub = Sub.fromJSON(container, json.child);
		var frame = new Frame(sub);
		frame.rect = Rect.from(json.rect);
		return frame;
	};
	
	var HANDLE = 6; // px const
	var H2 = HANDLE * 2;
	
	prototype.bodyRect = true;
	
	prototype.forEdgeDef = function (v, h, cursor) {
		if (cursor) {
			var edge = new Edge(this, v, h, cursor);
			this.element.appendChild(edge.element);
		}
	};
	
	prototype.setZ = function (zIndex) {
		this.element.style.zIndex = zIndex;
	};
	
	prototype.removeChild = function (sub, pauseLayout) {
		this.parent.removeChild(this, pauseLayout);
	};
	
	prototype.getChild = function (cPoint) {
		if (this.cRect.contains(cPoint)) {
			return this.child.getChild(cPoint) || this;
		}
		return null;
	};
	
	prototype.onActivate = function () {
		this.parent.activateChild(this);
	};
	prototype.activation = function () {
		this.addActiveClass();
	};
	prototype.deactivation = function () {
		this.removeActiveClass();
	};
	
	prototype.layout = function () {
		this.setRect(this.rect);
		this.child.layout(this.rect.width);
	};
	prototype.move = function (vector) {
		this.rect = this.rect.plus(vector);
		this.setPos(this.rect.top, this.rect.left);
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
		json.rect = this.rect;
		return json;
	};
	
	return Frame;
})(Single);

var Dock = _(function (Base, base) {
	
	function Dock(horizontal) {
		Base.call(this, 'dock');
		
		this.horizontal = horizontal;
		this.before = new DockPane(this, false);
		this.after  = new DockPane(this, true);
		
		// DOM
		if (horizontal) this.addHorizontalClass();
		this.body.appendChild(this.before.element);
		this.body.appendChild(this.after .element);
	}
	var prototype = inherit(Dock, base);
	
	Dock.TYPE = 'dock';
	
	Dock.fromJSON = function (container, json) {
		var dock = new Dock(json.horizontal);
		dock.fromJSON(container, json);
		dock.before.fromJSON(container, json.before);
		dock.after .fromJSON(container, json.after);
		return dock;
	};
	
	prototype.onRemove = function () {
		if (this.before.children.length) return;
		if (this.after .children.length) return;
		
		var parent = this.parent;
		parent.removeChild();
		if (parent     instanceof Dock &&
		    this.child instanceof Dock) {
			
			parent.setChild(this.child.child);
			parent.before.merge(this.child.before);
			parent.after .merge(this.child.after);
		} else {
			parent.setChild(this.child);
		}
	};
	
	prototype.setChild = function (child) {
		this.child = child;
		child.parent = this;
		this.body.insertBefore(child.element, this.after.element);
	};
	
	prototype.calcRect = function () {
		base.calcRect.call(this);
		this.before.calcRect();
		this.after .calcRect();
	};
	prototype.getChild = function (cPoint) {
		if (this.cRect.contains(cPoint)) {
			return this.child .getChild(cPoint)
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
		var size = this.child.getMinSize();
		var sum = this.before.size + this.after.size;
		return this.horizontal ?
			new Size(size.width + sum, size.height) :
			new Size(size.width, size.height + sum);
	};
	
	prototype.onresize = function (width, height) {
		this.setSize(width, height);
		var sum = this.before.size + this.after.size;
		if (this.horizontal) {
			this.before.onresize(this.before.size, height);
			this.child .onresize(width - sum,      height);
			this.after .onresize(this.after.size,  height);
		} else {
			this.before.onresize(width, this.before.size);
			this.child .onresize(width, height - sum);
			this.after .onresize(width, this.after.size);
		}
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.before = this.before;
		json.after  = this.after;
		json.horizontal = this.horizontal;
		json.type = Dock.TYPE;
		return json;
	};
	
	return Dock;
})(DockBase);


var PaneBase = _(function (Base, base) {
	
	function PaneBase(className, horizontal) {
		Base.call(this, className);
		
		this.horizontal = horizontal;
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
		this.body.appendChild(splitter.element);
	};
	prototype.removeSplitter = function (i) {
		var splitter = this.splitters[i];
		this.splitters.splice(i, 1);
		for (var l = this.splitters.length; i < l; i++) {
			this.splitters[i].index = i;
		}
		this.body.removeChild(splitter.element);
	};
	prototype.insertSplitter = function (i, refElement) {
		var splitter = new Splitter(this, i);
		this.splitters.splice(i, 0, splitter);
		for (var l = this.splitters.length; i < l; i++) {
			this.splitters[i].index = i;
		}
		this.body.insertBefore(splitter.element, refElement);
	};
	
	prototype.replaceChild = function (child, oldChild) {
		delete oldChild.parent;
		child.parent = this;
		this.children.splice(oldChild.index, 1, child);
		child.index = oldChild.index;
		
		this.body.replaceChild(child.element, oldChild.element);
	};
	
	prototype.fromJSON = function (container, json) {
		var length = json.children.length;
		for (var i = 0; i < length; i++) {
			var child = json.children[i];
			var layout;
			switch (child.type) {
				case Pane.TYPE:
				layout = Pane.fromJSON(container, child);
				break;
				
				case Sub.TYPE:
				layout = Sub.fromJSON(container, child);
				break;
			}
			layout.size = child.size;
			this.appendChild(layout);
		}
	};
	
	return PaneBase;
})(Multiple);

var DockPane = _(function (Base, base) {
	
	function DockPane(dock, order) {
		Base.call(this, 'dockpane', dock.horizontal);
		this.parent = dock;
		
		this.size = 0;
		this.order = order;
	}
	var prototype = inherit(DockPane, base);
	
	function Drag(dockpane, container) {
		this.container = container;
		
		var size = container.size;
		var min  = container.minSize;
		var rem = dockpane.horizontal ?
			size.width  - min.width :
			size.height - min.height;
		
		this.maxSize = dockpane.size + rem;
	}
	
	prototype.onSplitterDragStart = function (splitter) {
		var inner = this.order ? 0 : this.children.length - 1;
		if (splitter.index == inner) {
			this.drag = new Drag(this, splitter.container);
		}
	};
	prototype.onSplitterDrag = function (i, delta) {
		var child = this.children[i];
		var d = this.order ? -delta : delta;
		
		if (d < -child.size) d = -child.size;
		var drag = this.drag;
		if (drag) {
			if (d < -this.size) d = this.size;
			var rem = drag.maxSize - this.size;
			if (rem < d) d = rem;
			this.size  += d;
			child.size += d;
			
			drag.container.updateMinSize();
		} else {
			var next = this.children[this.order ? i - 1 : i + 1];
			if (d > next.size) d = next.size;
			child.size += d;
			next .size -= d;
		}
		return this.order ? -d : d;
	};
	
	prototype.merge = function (dockpane) {
		var children = dockpane.children;
		var i, length = children.length;
		if (this.order) {
			for (i = length - 1; i >= 0; i--) {
				this.prependChild(children[i]);
			}
		} else {
			for (i = 0; i < length; i++) {
				this.appendChild(children[i]);
			}
		}
	};
	
	prototype.expand = function (child) {
		this.size += child.size + Splitter.SIZE;
	};
	prototype.appendChild = function (child) {
		this.expand(child);
		if (this.order) {
			this.appendSplitter();
			base.appendChild.call(this, child);
		} else {
			base.appendChild.call(this, child);
			this.appendSplitter();
		}
	};
	prototype.removeChild = function (child, pauseLayout) {
		this.size -= child.size + Splitter.SIZE;
		base.removeChild.call(this, child);
		this.removeSplitter(child.index);
		
		if (pauseLayout) return;
		
		this.getContainer().updateMinSize();
		this.parent.onRemove();
	};
	prototype.insertChild = function (child, refChild) {
		if (refChild == null) {
			this.appendChild(child);
			return;
		}
		this.expand(child);
		base.insertChild.call(this, child, refChild);
		this.insertSplitter(
			child.index + this.order, refChild.element);
	};
	prototype.prependChild = function (child) {
		this.insertChild(child, this.children[0]);
	};
	
	prototype.onresize = function (width, height) {
		this.setSize(width, height);
		var i, length = this.children.length;
		var child;
		if (this.horizontal) {
			for (i = 0; i < length; i++) {
				child = this.children[i];
				child.onresize(child.size, height);
			}
		} else {
			for (i = 0; i < length; i++) {
				child = this.children[i];
				child.onresize(width, child.size);
			}
		}
	};
	
	return DockPane;
})(PaneBase);

var Pane = _(function (Base, base) {
	
	function Pane(horizontal) {
		Base.call(this, 'pane', horizontal);
		
		this.sizes = [];
		this.collapse = false;
	}
	var prototype = inherit(Pane, base);
	
	Pane.TYPE = 'pane';
	
	Pane.fromJSON = function (container, json) {
		var pane = new Pane(json.horizontal);
		pane.fromJSON(container, json);
		return pane;
	};
	
	function Drag() { }
	
	var COLLAPSE_NAME = NAME_PREFIX + 'collapse';
	
	prototype.onSplitterDragStart = function () {
		if (this.remSize) {
			this.calcSizes();
		} else {
			this.drag = new Drag();
		}
	};
	prototype.onSplitterDrag = function (i, delta) {
		if (this.drag) return;
		var n = i + 1;
		
		var iSize = this.sizes[i];
		var nSize = this.sizes[n];
		
		if (delta < -iSize) delta = -iSize;
		if (delta >  nSize) delta =  nSize;
		
		this.children[i].size = (iSize + delta) / this.remSize;
		this.children[n].size = (nSize - delta) / this.remSize;
		
		return delta;
	};
	
	prototype.merge = function (pane, ref) {
		var children = pane.children;
		var i, length = children.length;
		var child;
		
		this.remSize -= pane.collapse ?
			this.sizes[ref.index] : Splitter.SIZE * (length - 1);
		if (this.remSize) {
			this.calcSizes();
			var sizes = pane.sizes;
			for (i = 0; i < length; i++) {
				child = children[i];
				child.size = sizes[i] / this.remSize;
				this.insertChild(child, ref);
			}
		} else {
			for (i = 0; i < length; i++) {
				child = children[i];
				child.size *= ref.size;
				this.insertChild(child, ref);
			}
		}
		this.removeChild(ref, true);
	};
	
	prototype.appendChild = function (child) {
		if (this.children.length) this.appendSplitter();
		base.appendChild.call(this, child);
	};
	prototype.removeChild = function (child, pauseLayout) {
		base.removeChild.call(this, child);
		var index = child.index;
		if (this.splitters.length) {
			this.removeSplitter(index ? index - 1 : index);
		}
		if (pauseLayout) return;
		
		var l = this.children.length;
		if (l == 1) {
			var remChild = this.children[0];
			if (remChild    instanceof Pane &&
			    this.parent instanceof Pane) {
				
				this.parent.merge(remChild, this);
			} else {
				remChild.size = this.size;
				this.parent.replaceChild(remChild, this);
			}
			return;
		}
		if (l) {
			var li = index == 0 ? 0 : index - 1;
			var ri = index == l ? l - 1 : index;
			var cl = this.children[li];
			var cr = this.children[ri];
			
			var size = this.collapse ? child.size :
				this.sizes[index] + Splitter.SIZE;
			var ls = cl.size;
			var rs = cr.size;
			var sum = ls + rs;
			if (sum == 0.) { sum = 1.; ls = rs = .5; }
			
			if (this.collapse) {
				cl.size += size * ls / sum;
				cr.size += size * rs / sum;
			} else {
				this.remSize += Splitter.SIZE;
				this.sizes.splice(index, 1);
				this.sizes[li] += size * ls / sum;
				this.sizes[ri] += size * rs / sum;
				this.calcSizes();
			}
		} else {
			this.parent.removeChild(this, false);
		}
	};
	prototype.insertChild = function (child, refChild) {
		if (refChild == null) {
			this.appendChild(child);
			return;
		}
		base.insertChild.call(this, child, refChild);
		this.insertSplitter(child.index, refChild.element);
	};
	
	prototype.calcSizes = function () {
		var length = this.children.length;
		for (var i = 0; i < length; i++) {
			this.children[i].size = this.sizes[i] / this.remSize;
		}
	};
	
	prototype.divideSizes = function (size) {
		if (size < 0) {
			this.remSize = 0;
			if (!this.collapse) {
				this.collapse = true;
				this.addClass(COLLAPSE_NAME);
			}
		} else {
			this.remSize = size;
			if (this.collapse) {
				this.collapse = false;
				this.removeClass(COLLAPSE_NAME);
			}
		}
		var length = this.children.length;
		this.sizes.length = length;
		
		var sum = .0; var prev = 0;
		for (var i = 0; i < length; i++) {
			sum += this.children[i].size;
			var pos = Math.round(this.remSize * sum);
			this.sizes[i] = pos - prev;
			prev = pos;
		}
	};
	prototype.onresize = function (width, height) {
		this.setSize(width, height);
		var sum = Splitter.SIZE * this.splitters.length;
		var i, length = this.children.length;
		if (this.horizontal) {
			this.divideSizes(width - sum);
			for (i = 0; i < length; i++) {
				this.children[i].onresize(this.sizes[i], height);
			}
		} else {
			this.divideSizes(height - sum);
			for (i = 0; i < length; i++) {
				this.children[i].onresize(width, this.sizes[i]);
			}
		}
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.horizontal = this.horizontal;
		json.size = this.size;
		json.type = Pane.TYPE;
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
		
		this.body = createDiv('contents');
		this.body.appendChild(cover);
		
		this.element.appendChild(this.tabstrip.element);
		this.element.appendChild(this.body);
	}
	var prototype = inherit(Contents, base);
	
	prototype.appendChild = function (content, pauseLayout) {
		base.appendChild.call(this, content);
		this.tabstrip.appendTab(content.tab);
		
		if (pauseLayout) return;
		this.setTabSize();
	};
	prototype.insertChild = function (content, refChild) {
		if (refChild == null) {
			this.appendChild(content, true);
			return;
		}
		this.tabstrip.insertTab(content.tab, refChild.tab);
		base.insertChild.call(this, content, refChild);
	};
	prototype.removeChild = function (content) {
		this.tabstrip.removeTab(content.tab);
		base.removeChild.call(this, content);
		
		if (this.children.length) this.setTabSize();
	};
	
	prototype.moveChild = function (index, to) {
		var child = this.children[index];
		this.children.splice(index, 1);
		this.children.splice(to, 0, child);
		
		if (index > to) {
			var tmp = index; index = to; to = tmp;
		}
		for (var i = index; i <= to; i++) {
			this.children[i].index = i;
		}
	};
	
	prototype.calcRect = function () {
		this.cRect = this.getRect();
	};
	prototype.getChild = function (cPoint) {
		if (this.cRect.contains(cPoint)) return this;
		return null;
	};
	prototype.deleteRect = function () {
		delete this.cRect;
	};
	
	prototype.detachChild = function (content, i) {
		if (i == this.children.length - 1) {
			if (i == content.index) i--;
		} else {
			if (i >= content.index) i++;
		}
		this.active = null;
		this.activateChild(this.children[i]);
		this.removeChild(content);
		
		var sub = new Sub();
		sub.appendChild(content, true);
		sub.activateChild(content);
		return sub;
	};
	
	prototype.deactivateAll = function () {
		var length = this.children.length;
		for (var i = 0; i < length; i++) {
			this.children[i].deactivation();
		}
	};
	
	prototype.onStripDragStart = function () { };
	prototype.onStripDrag = function (delta) { };
	prototype.onStripDrop = function () { };
	
	prototype.fromJSON = function (container, json) {
		var length = json.children.length;
		for (var i = 0; i < length; i++) {
			var child = json.children[i];
			var content = Content.fromJSON(container, child);
			this.appendChild(content, true);
		}
		if (length) {
			var active = this.children[json.active];
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
	prototype.onresize = function (width, height) {
		this.setSize(width, height);
		this.width = width;
		this.setTabSize();
	};
	prototype.setTabSize = function () {
		this.tabstrip.onresize(this.width, TAB_SIZE, 0);
	};
	
	prototype.getMain = function () {
		return this;
	};
	
	prototype.toJSON = function () {
		var children = []; var active = 0;
		
		if (this.active) {
			var index = this.active.index;
			var length = this.children.length;
			for (var i = 0; i < length; i++) {
				var child = this.children[i];
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
			children: children,
			active: active,
			type: Main.TYPE
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
		return delta.max(new Vector(
			Frame.MIN_R - rect.right(),
			Edge.SIZE   - rect.top));
	}
	
	prototype.detached = null;
	
	prototype.openFloat = function (container, rect, delta) {
		var frame = new Frame(this);
		var d = max(delta, rect);
		frame.rect = rect.plus(d).max(TabStrip.HEIGHT);
		
		container.floats.appendChild(frame);
		frame.activate();
		return d;
	};
	
	prototype.onStripDragStart = function () {
		this.tabstrip.addGrabbingClass();
		this.tabstrip.container.guide.ondragstart(this);
	};
	prototype.onStripDrag = function (delta) {
		var container = this.tabstrip.container;
		
		if (this.parent instanceof Frame) {
			var d = max(delta, this.parent.rect);
			this.parent.move(d);
			
			container.guide.ondrag();
			return d;
		}
		
		var rect = this.getRectOf(container).round();
		this.parent.removeChild(this, false);
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
	
	prototype.removeChild = function (content) {
		base.removeChild.call(this, content);
		
		if (this.children.length) return;
		var container = this.getContainer();
		this.parent.removeChild(this, false);
		container.layout();
	};
	
	prototype.onresize = function (width, height) {
		this.setSize(width, height);
		this.layout(width);
	};
	prototype.layout = function (width) {
		this.width = width;
		this.setTabSize();
	};
	prototype.setTabSize = function () {
		if (this.detached) return;
		this.tabstrip.onresize(
			this.width, TAB_SIZE, TabStrip.HEIGHT);
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.active = this.active.index;
		if (this.parent instanceof PaneBase) {
			json.size = this.size;
			json.type = Sub.TYPE;
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
			this.id = options.value;
			options = null;
		}
		
		var t = Option.get(options, 'title');
		this.title = t ? t.value : iframe.getAttribute(TITLE_NAME);
		
		var f = Option.get(options, 'fixed');
		var fixed = f ? f.value : iframe.hasAttribute(FIXED_NAME);
		
		this.hidden = true;
		
		this.tab = new Tab(this);
		this.setFixed(fixed);
		
		this.isIframe = iframe.tagName == 'IFRAME';
		// DOM
		if (this.isIframe && iframe.onload == null) {
			iframe.onload = function () {
				self.updateTitle();
			};
		}
		this.body.appendChild(iframe);
	}
	var prototype = inherit(Content, base);
	
	Content.fromJSON = function (container, json) {
		return container.contents[json.id];
	};
	
	prototype.id = null;
	
	prototype.onvisibilitychange = null;
	prototype.onclose = null;
	
	prototype.setTitle = function (title) {
		this.title = title;
		this.updateTitle();
	};
	prototype.getTitle = function () {
		if (this.title) return this.title;
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
		this.tab.setTitle(this.getTitle());
	};
	
	prototype.setFixed = function (fixed) {
		this.tab.setFixed(fixed);
	};
	
	prototype.setHidden = function (hidden) {
		if (hidden == this.hidden) return;
		this.hidden = hidden;
		
		if (isFunction(this.onvisibilitychange)) {
			try {
				this.onvisibilitychange();
			} catch (_) { }
		}
	};
	
	prototype.onActivate = function () {
		this.parent.activateChild(this);
	};
	prototype.activation = function () {
		this.addActiveClass();
		this.tab.addActiveClass();
		this.setHidden(false);
	};
	prototype.deactivation = function () {
		this.removeActiveClass();
		this.tab.removeActiveClass();
		this.setHidden(true);
	};
	
	prototype.close = function () {
		if (isFunction(this.onclose)) {
			try {
				if (this.onclose() == false) {
					this.activate();
					return;
				}
			} catch (_) { }
		}
		this.deactivation();
		this.parent.removeChild(this);
	};
	
	prototype.isClosed = function () {
		return !this.getContainer();
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.id = this.id;
		return json;
	};
	
	return Content;
})(Layout);


return (function () {
	
	function DryDock(element) {
		var container = new Container(element);
		
		this.layout = container;
		this.contents = container.contents;
		
		addEventListener('resize', function () {
			container.onresize();
		});
	}
	var prototype = DryDock.prototype;
	
	DryDock.Container = Container;
	DryDock.Frame = Frame;
	DryDock.Dock = Dock;
	DryDock.Pane = Pane;
	DryDock.Main = Main;
	DryDock.Sub = Sub;
	DryDock.Content = Content;
	
	var DIFF = new Vector(TabStrip.HEIGHT, TabStrip.HEIGHT);
	
	function c(size, rect, dimension) {
		return (size[dimension] - rect[dimension]) / 2;
	}
	
	function test(children, rect) {
		var length = children.length;
		for (var i = 0; i < length; i++) {
			var child = children[i];
			if (child.rect.equals(rect)) return true;
		}
		return false;
	}
	function move(children, rect, size) {
		while (test(children, rect)) {
			var diff = new Vector(
				size.width  - rect.right(),
				size.height - rect.bottom()
			).max(Vector.ZERO).min(DIFF);
			
			if (diff.equals(Vector.ZERO)) break;
			rect = rect.plus(diff);
		}
		return rect;
	}
	
	prototype.open = function (element, options) {
		var content = new Content(element, options);
		this.openMain(content);
		return content;
	};
	
	prototype.openMain = function (content) {
		if (content.isClosed()) {
			var main = this.layout.getMain();
			main.appendChild(content, false);
		}
		content.activate();
	};
	prototype.openSub = function (content, rect) {
		if (content.isClosed()) {
			var r = rect == null ? new Rect : Rect.from(rect);
			var s = this.layout.cSize;
			
			if (!r.width ) r.width  = 300;
			if (!r.height) r.height = 200;
			if (r.top  == null) r.top  = c(s, r, 'height');
			if (r.left == null) r.left = c(s, r, 'width');
			
			r = move(this.layout.floats.children,
				r.round(), s.shrink(Edge.SIZE));
			
			var sub = new Sub();
			sub.appendChild(content, true);
			sub.activateChild(content);
			sub.openFloat(this.layout, r, Vector.ZERO);
			return;
		}
		content.activate();
	};
	
	prototype.init = function () {
		this.layout.init();
		this.layout.setChild(new Main());
		this.layout.activate();
		this.layout.onresize();
	};
	
	prototype.serialize = function () {
		return JSON.stringify(this.layout);
	};
	prototype.restore = function (jsonString) {
		this.layout.init();
		this.layout.fromJSON(JSON.parse(jsonString));
		this.layout.activate();
		this.layout.onresize();
	};
	
	return DryDock;
})();

})(document, Node, Math, JSON);
