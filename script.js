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
			Math.floor(event.clientX),
			Math.floor(event.clientY));
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
		return this.left <= vector.x
		    && this.top  <= vector.y
		    && vector.x < this.left + this.width
		    && vector.y < this.top  + this.height;
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
	
	function ButtonDef(letter, horizontal, last) {
		this.letter = letter;
		this.horizontal = horizontal;
		this.last = last;
	}
	var prototype = ButtonDef.prototype;
	
	ButtonDef.TOP    = new ButtonDef('↑', false, false);
	ButtonDef.RIGHT  = new ButtonDef('→', true,  true);
	ButtonDef.BOTTOM = new ButtonDef('↓', false, true);
	ButtonDef.LEFT   = new ButtonDef('←', true,  false);
	ButtonDef.CENTER = new ButtonDef('＋', false, false);
	
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
		var size = this.horizontal ?
			rect.width : rect.height;
		return size - Splitter.SIZE;
	};
	
	prototype.calcInsert = function (target) {
		var parent = target.parent;
		var ti = target.index;
		var ni = this.last ? ti + 1 : ti - 1;
		
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
			GuideButton.MARGIN,
			GuideButton.MARGIN);
		this.l = new Vector(
			rect.width  - GuideButton.SM,
			rect.height - GuideButton.SM);
	}
	
	ButtonPos.center = function (rect) {
		return new Vector(
			(rect.width  - GuideButton.SIZE) / 2,
			(rect.height - GuideButton.SIZE) / 2);
	};
	
	return ButtonPos;
})();


var Pointer = (function () {
	
	function Pointer(event, hardDrag) {
		var point = Vector.from(event);
		this.point     = point;
		this.dragStart = point;
		this.dragDiff  = Vector.ZERO;
		this.hardDrag  = hardDrag;
		this.firstDrag = true;
	}
	
	return Pointer;
})();

var Options = (function () {
	
	function Options(id) {
		this.id = id;
	}
	
	return Options;
})();

var Division = (function () {
	
	function Division(value) {
		this.value = value;
		this.sum   = 0;
		this.rounds = [];
		this.values = [];
	}
	var prototype = Division.prototype;
	
	function Round(index, value) {
		this.index = index;
		this.value = value;
	}
	function compare(a, b) {
		return b.value - a.value || b.index - a.index;
	}
	
	prototype.set = function (i, prop) {
		var value = this.value * prop;
		var floor = Math.floor(value);
		
		this.sum      += floor;
		this.values[i] = floor;
		this.rounds[i] = new Round(i, value - floor);
	};
	prototype.get = function () {
		this.rounds.sort(compare);
		var diff = this.value - this.sum;
		for (var i = 0; i < diff; i++) {
			this.values[this.rounds[i].index]++;
		}
		return this.values;
	};
	
	return Division;
})();


var Model = (function () {
	
	function Model(className) {
		className = NAME_PREFIX + className;
		this.classList = [className];
		
		this.element = $.createElement(this.tagName);
		this.element.className = className;
		
		this.body = this.element;
	}
	var prototype = Model.prototype;
	
	var ACTIVE_NAME = NAME_PREFIX + 'active';
	
	function indexOf(array, item) {
		var length = array.length;
		for (var i = 0; i < length; i++) {
			if (array[i] === item) return i;
		}
		return -1;
	}
	
	prototype.tagName = 'div';
	prototype.parent = null;
	
	prototype.onActivate = function () { };
	prototype.activate = function () {
		this.onActivate();
		this.parent.activate();
	};
	
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
	
	prototype.bodyRect = false;
	prototype.getRect = function () {
		var element = this.bodyRect ?
			this.body : this.element;
		return Rect.from(element.getBoundingClientRect());
	};
	
	prototype.applyClass = function () {
		this.element.className = this.classList.join(' ');
	};
	prototype.addClass = function (className) {
		if (indexOf(this.classList, className) == -1) {
			this.classList.push(className);
			this.applyClass();
		}
	};
	prototype.removeClass = function (className) {
		var index = indexOf(this.classList, className);
		if (index == -1) return;
		this.classList.splice(index, 1);
		this.applyClass();
	};
	
	prototype.addActiveClass = function () {
		this.addClass(ACTIVE_NAME);
	};
	prototype.removeActiveClass = function () {
		this.removeClass(ACTIVE_NAME);
	};
	
	prototype.getContainer = function () {
		if (this.parent) {
			return this.parent.getContainer();
		}
		return null;
	};
	
	return Model;
})();


var Control = _(function (Base, base) {
	
	function Control(className, parent) {
		Base.call(this, className);
		
		this.parent = parent;
	}
	var prototype = inherit(Control, base);
	
	prototype.hide = function () {
		this.element.style.display = 'none';
	};
	prototype.show = function () {
		this.element.style.display = '';
	};
	
	prototype.setDisable = function (disable) {
		this.disable = disable;
		if (disable) {
			this.hide();
		} else {
			this.show();
		}
	};
	
	return Control;
})(Model);

var Draggable = _(function (Base, base) {
	
	function Draggable(className, parent) {
		Base.call(this, className, parent);
		
		var self = this;
		function mousedown(event) {
			var target = event.target;
			if (target == this || target == self.body) {
				if (event.button) self.activate();
				else {
					var container = self.getContainer();
					container.setDragging(self);
					container.mousedown(event);
				}
				return false;
			}
		}
		this.element.onmousedown  = mousedown;
		this.element.ontouchstart = toTouch(mousedown);
	}
	var prototype = inherit(Draggable, base);
	
	Draggable.THRESHOLD = 6 * 6;
	
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
		this.setCursor(pane.horizontal ?
			'ew-resize' : 'ns-resize');
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
		var d = this.parent.onSplitterDrag(
			this.index,
			this.parent.horizontal ? delta.x : delta.y);
		
		if (d) this.container.layout();
		return this.parent.horizontal
			? new Vector(d, delta.y)
			: new Vector(delta.x, d);
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
		
		this.body = $.createElement('span');
		this.body.className = NAME_PREFIX + 'title';
		this.body.appendChild(this.textNode);
		
		var close = new Close(this, content);
		
		this.element.title = title;
		this.element.appendChild(this.body);
		this.element.appendChild(close.element);
	}
	var prototype = inherit(Tab, base);
	
	function Drag(tab) {
		this.contents = tab.tabstrip.parent;
		this.detachable = this.contents instanceof Sub;
		
		if (this.detachable) {
			this.diff = Vector.ZERO;
			this.i = tab.index();
			this.min = -tab.tabstrip.tabSize;
			this.max = this.contents.width +
				this.min * (tab.tabstrip.tabs.length - 1);
		}
		this.x = 0;
	}
	
	var FIXED_NAME = NAME_PREFIX + 'fixed';
	
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
	
	prototype.detach = function (container) {
		var drag = this.drag;
		var contents = drag.contents;
		var rect = contents.getRectOf(container).round();
		var sub = contents.detachChild(this.parent, drag.i);
		sub.detached = this;
		
		container.setDragging(sub.tabstrip);
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
				
				this.removeGrabbingClass();
				this.setLeft(this.tabstrip.tabSize * drag.i);
				return this.detach(this.container).minus(diff);
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
	prototype.ondrag = function (delta) {
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


var GuideBase = _(function (Base, base) {
	
	function GuideBase(className, parent, container) {
		Base.call(this, className, parent, container);
		
		this.container = container;
		
		this.area = new GuideArea(this);
		this.top    = new GuideButton(this, ButtonDef.TOP);
		this.right  = new GuideButton(this, ButtonDef.RIGHT);
		this.bottom = new GuideButton(this, ButtonDef.BOTTOM);
		this.left   = new GuideButton(this, ButtonDef.LEFT);
		
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
			if (droppable) {
				this.droppable = droppable;
				droppable.onenter();
				this.enter(droppable);
				this.area.show();
			} else {
				delete this.droppable;
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
	
	return GuideBase;
})(Control);

var Guide = _(function (Base, base) {
	
	function Guide(parent) {
		Base.call(this, 'guide', parent, parent);
		
		this.child = new GuidePane(this);
		this.body.appendChild(this.child.element);
	}
	var prototype = inherit(Guide, base);
	
	function Drag(contents) {
		this.contents = contents;
		this.target = null;
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
			
			this.top   .setPos(pos.f.y, pos.c.x);
			this.right .setPos(pos.c.y, pos.l.x);
			this.bottom.setPos(pos.l.y, pos.c.x);
			this.left  .setPos(pos.c.y, pos.f.x);
			
			this.show();
			drag.firstDrag = false;
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
		this.area.setOuterArea(
			button.def, this.container.cRect);
	};
	
	prototype.ondrop = function () {
		this.child.ondrop();
		var drag = this.drag;
		if (drag) {
			delete this.drag;
			
			if (drag.target) {
				this.child.drop(drag.contents, drag.target);
			}
			this.drop(drag.contents, this.container);
		}
		this.container.deleteRect();
	};
	
	return Guide;
})(GuideBase);

var GuidePane = _(function (Base, base) {
	
	function GuidePane(parent) {
		Base.call(this, 'guidepane', parent, parent.container);
		
		this.center = new GuideButton(this, ButtonDef.CENTER);
		this.guidestrip = new GuideStrip(this);
		this.body.appendChild(this.center.element);
		this.body.appendChild(this.guidestrip.element);
	}
	var prototype = inherit(GuidePane, base);
	
	function Drag(rect, pane, main) {
		this.rect = rect;
		this.pane = pane;
		this.main = main;
	}
	
	prototype.onenter = function (target) {
		var parent = target.parent;
		var drag = new Drag(
			target.cRect.of(this.container.cRect),
			parent instanceof Pane,
			target instanceof Main);
		this.drag = drag;
		
		this.setRect(drag.rect);
		
		
		var c = ButtonPos.center(drag.rect);
		this.top   .setPos(c.y - GuideButton.SM, c.x);
		this.right .setPos(c.y, c.x + GuideButton.SM);
		this.bottom.setPos(c.y + GuideButton.SM, c.x);
		this.left  .setPos(c.y, c.x - GuideButton.SM);
		this.center.setPos(c.y, c.x);
		
		var frame = parent instanceof Frame;
		this.top   .setDisable(frame);
		this.right .setDisable(frame);
		this.bottom.setDisable(frame);
		this.left  .setDisable(frame);
		this.center.setDisable(drag.main);
		
		this.show();
	};
	prototype.ondrag = function (vector, button, hit) {
		if (button || hit || this.drag.main) {
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
		var target = this.parent.drag.target;
		
		if (droppable == this.guidestrip) {
			this.area.setStripArea();
			droppable.enter(target);
			return;
		}
		var drag = this.drag;
		var def = droppable.def;
		if (drag.main) {
			this.area.setMainArea(def, drag.rect);
			return;
		}
		if (drag.pane && def != ButtonDef.CENTER) {
			var pane = target.parent;
			if (pane.horizontal == def.horizontal) {
				
				if (target.index != (def.last ?
					pane.children.length - 1 : 0)) {
					
					this.area.setInsertArea(def, target);
					return;
				}
			}
		}
		this.area.setArea(def, drag.rect);
	};
	
	prototype.ondrop = function () {
		delete this.drag;
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
	
	function GuideDroppable(className, parent) {
		Base.call(this, className, parent);
		
		this.container = parent.container;
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
	
	prototype.mergeTabs = function (contents, target, index) {
		var refChild = target.children[index];
		var length = contents.children.length;
		for (var i = 0; i < length; i++) {
			target.insertChild(contents.children[i], refChild);
		}
		target.activateChild(contents.active);
	};
	
	return GuideDroppable;
})(Control);

var GuideStrip = _(function (Base, base) {
	
	function GuideStrip(parent) {
		Base.call(this, 'guidestrip', parent);
		
		this.area = new GuideArea(this);
		this.body.appendChild(this.area.element);
	}
	var prototype = inherit(GuideStrip, base);
	
	function Drag(target) {
		this.index = -1;
		this.tabSize = target.tabstrip.tabSize;
		this.length  = target.children.length;
	}
	
	prototype.enter = function (target) {
		this.drag = new Drag(target);
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

var GuideButton = _(function (Base, base) {
	
	function GuideButton(parent, def) {
		Base.call(this, 'guidebutton', parent);
		
		this.def = def;
		this.body.appendChild($.createTextNode(def.letter));
	}
	var prototype = inherit(GuideButton, base);
	
	GuideButton.SIZE   = 40; // px const
	GuideButton.MARGIN =  3; // px const
	GuideButton.SM = GuideButton.SIZE + GuideButton.MARGIN;
	
	var HOVER_NAME = NAME_PREFIX + 'hover';
	
	prototype.setPos = function (top, left) {
		this.rect = new Rect(
			top, left,
			GuideButton.SIZE,
			GuideButton.SIZE);
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
		if (this.def == ButtonDef.CENTER) { // タブ追加
			this.mergeTabs(contents, target, -1);
			return;
		} 
		if (target == this.container) { // 外側
			this.outer(contents, target, target.child);
			this.container.updateMinSize();
			return;
		}
		if (target instanceof Main) { // Dock 追加
			this.dockPane(contents, target, parent);
			this.container.updateMinSize();
			return;
		}
		if (parent instanceof Pane &&
			parent.horizontal == this.def.horizontal) {
			
			if (target.index == (this.def.last ?
				parent.children.length - 1 : 0)) {
				
				this.splitPane(contents, target, parent);
			} else {
				this.insertPane(contents, target, parent);
			}
		} else {
			this.newPane(contents, target, parent);
		}
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
		(this.def.last ?
			dock.lasts : dock.firsts).appendChild(pane);
		return dock;
	};
	
	prototype.outer = function (contents, container, child) {
		contents.size = this.sizeOf(child, 5);
		if (this.test(child)) {
			if (this.def.last) {
				child.lasts.appendChild(contents);
			} else {
				child.firsts.prependChild(contents);
			}
		} else {
			container.removeChild();
			container.setChild(this.newDock(child, contents));
		}
	};
	prototype.dockPane = function (contents, target, parent) {
		contents.size = this.sizeOf(target, 3);
		if (this.test(parent)) {
			if (this.def.last) {
				parent.lasts.prependChild(contents);
			} else {
				parent.firsts.appendChild(contents);
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
		
		if (this.def.last) {
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
		
		contents.size = target.size =
			(size - Splitter.SIZE) /
			(parent.remSize * 2);
		parent.insertChild(contents, this.def.last ?
			parent.children[target.index + 1] : target);
	};
	prototype.insertPane = function (contents, target, parent) {
		var ins = this.def.calcInsert(target);
		
		parent.sizes[ins.t.i] -= ins.t.diff;
		parent.sizes[ins.n.i] -= ins.n.diff;
		parent.sizes.splice(this.def.last ?
			ins.n.i : ins.t.i, 0, ins.size);
		
		parent.insertChild(contents, this.def.last ?
			parent.children[ins.t.i + 1] : target);
		
		parent.remSize -= Splitter.SIZE;
		parent.calcSizes();
	};
	
	return GuideButton;
})(GuideDroppable);

var GuideArea = _(function (Base, base) {
	
	function GuideArea(parent) {
		Base.call(this, 'guidearea', parent);
		
		this.hide();
	}
	var prototype = inherit(GuideArea, base);
	
	var HEIGHT_PX = TabStrip.HEIGHT + 'px';
	
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
		this.set(def, '0', size - size / 3);
	};
	prototype.setOuterArea = function (def, rect) {
		var size = def.sizeOf(rect) - Container.M2;
		this.set(def, Container.PX,
			size - size / 5 + Container.MARGIN);
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
	prototype.setStripArea = function () {
		var s = this.element.style;
		s.top = HEIGHT_PX;
		s.right = s.bottom = s.left = '0';
	};
	
	return GuideArea;
})(Control);


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
})(Model);

var Single = _(function (Base, base) {
	
	function Single(className) {
		Base.call(this, className);
	}
	var prototype = inherit(Single, base);
	
	prototype.calcRect = function () {
		this.cRect = this.getRect();
		this.child.calcRect();
	};
	prototype.deleteRect = function () {
		delete this.cRect;
		this.child.deleteRect();
	};
	
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
		if (this.active) this.active.deactivating();
		this.active = child;
		child.activating();
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
	
	var FLOATING_NAME = NAME_PREFIX + 'floating';
	var DRAGGING_NAME = NAME_PREFIX + 'dragging';
	
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
					var o = new Options(id);
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
			var pointer = self.pointer;
			
			var point = Vector.from(event);
			if (pointer.hardDrag) {
				var sq = point.minus(pointer.dragStart).square();
				if (sq < Draggable.THRESHOLD) return;
				pointer.hardDrag = false;
			}
			var diff = point.minus(pointer.point);
			pointer.point = point;
			
			if (pointer.firstDrag) {
				self.dragging.ondragstart();
				pointer.firstDrag = false;
			}
			var sumDiff = pointer.dragDiff.plus(diff);
			var resDiff = self.dragging.ondrag(sumDiff);
			pointer.dragDiff = resDiff ?
				sumDiff.minus(resDiff) : Vector.ZERO;
		};
		this.mouseup = function () {
			this.onmousemove = null;
			this.onmouseup   = null;
			this.ontouchmove = null;
			this.ontouchend  = null;
			
			self.dragging.ondrop();
			self.removeClass(DRAGGING_NAME);
			self.setDragging(null);
			delete self.pointer;
		};
		this.touchmove = toTouch(this.mousemove);
		this.touchend  = toTouch(this.mouseup);
	}
	var prototype = inherit(Container, base);
	
	Container.MARGIN = 6; // px const
	Container.M2 = Container.MARGIN * 2;
	Container.PX = Container.MARGIN + 'px';
	
	prototype.dragging = null;
	
	prototype.setDragging = function (draggable) {
		if (this.dragging) {
			delete this.dragging.container;
		}
		if (draggable) {
			this.dragging = draggable;
			draggable.container = this;
		} else {
			delete this.dragging;
		}
	};
	prototype.mousedown = function (event) {
		this.pointer = new Pointer(event, this.dragging.hardDrag);
		
		this.overlay.style.cursor = this.dragging.cursor;
		this.addClass(DRAGGING_NAME);
		
		this.element.onmousemove = this.mousemove;
		this.element.onmouseup   = this.mouseup;
		this.element.ontouchmove = this.touchmove;
		this.element.ontouchend  = this.touchend;
		this.dragging.onmousedown();
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
	
	var HANDLE = 6; // px const
	var H2 = HANDLE * 2;
	
	Frame.MIN_R = Edge.SIZE + TabStrip.HEIGHT;
	
	Frame.fromJSON = function (container, json) {
		var sub = Sub.fromJSON(container, json.child);
		var frame = new Frame(sub);
		frame.rect = Rect.from(json.rect);
		return frame;
	};
	
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
	
	prototype.bodyRect = true;
	
	prototype.getChild = function (cPoint) {
		if (this.cRect.contains(cPoint)) {
			return this.child.getChild(cPoint) || this;
		}
		return null;
	};
	
	prototype.onActivate = function () {
		this.parent.activateChild(this);
	};
	prototype.activating = function () {
		this.addActiveClass();
	};
	prototype.deactivating = function () {
		this.removeActiveClass();
	};
	
	prototype.layout = function () {
		this.setRect(this.rect);
		this.child.layout(this.rect.width);
	};
	prototype.moveTo = function (rect) {
		this.rect = rect;
		this.setPos(rect.top, rect.left);
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
		this.firsts = new DockPane(this, false);
		this.lasts  = new DockPane(this, true);
		
		// DOM
		if (horizontal) this.addHorizontalClass();
		this.body.appendChild(this.firsts.element);
		this.body.appendChild(this.lasts .element);
	}
	var prototype = inherit(Dock, base);
	
	Dock.TYPE = 'dock';
	
	Dock.fromJSON = function (container, json) {
		var dock = new Dock(json.horizontal);
		dock.fromJSON(container, json);
		dock.firsts.fromJSON(container, json.firsts);
		dock.lasts .fromJSON(container, json.lasts);
		return dock;
	};
	
	prototype.onRemove = function () {
		if (this.firsts.children.length) return;
		if (this.lasts .children.length) return;
		
		var parent = this.parent;
		parent.removeChild();
		if (parent      instanceof Dock &&
		    this.child  instanceof Dock) {
			
			parent.firsts.merge(this.child.firsts);
			parent.lasts .merge(this.child.lasts);
			parent.setChild(this.child.child);
		} else {
			parent.setChild(this.child);
		}
	};
	
	prototype.calcRect = function () {
		base.calcRect.call(this);
		this.firsts.calcRect();
		this.lasts .calcRect();
	};
	prototype.getChild = function (cPoint) {
		if (this.cRect.contains(cPoint)) {
			return this.child .getChild(cPoint)
			    || this.firsts.getChild(cPoint)
			    || this.lasts .getChild(cPoint);
		}
		return null;
	};
	prototype.deleteRect = function () {
		base.deleteRect.call(this);
		this.firsts.deleteRect();
		this.lasts .deleteRect();
	};
	
	prototype.setChild = function (child) {
		this.child = child;
		child.parent = this;
		this.body.insertBefore(child.element, this.lasts.element);
	};
	
	prototype.deactivateAll = function () {
		base.deactivateAll.call(this);
		this.firsts.deactivateAll();
		this.lasts .deactivateAll();
	};
	
	prototype.getMinSize = function () {
		var size = this.child.getMinSize();
		var sum = this.firsts.size + this.lasts.size;
		return this.horizontal
			? new Size(size.width + sum, size.height)
			: new Size(size.width, size.height + sum);
	};
	
	prototype.onresize = function (width, height) {
		this.setSize(width, height);
		var sum = this.firsts.size + this.lasts.size;
		if (this.horizontal) {
			this.firsts.onresize(this.firsts.size, height);
			this.child .onresize(width - sum,      height);
			this.lasts .onresize(this.lasts.size,  height);
		} else {
			this.firsts.onresize(width, this.firsts.size);
			this.child .onresize(width, height - sum);
			this.lasts .onresize(width, this.lasts.size);
		}
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.horizontal = this.horizontal;
		json.firsts = this.firsts;
		json.lasts  = this.lasts;
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
	
	prototype.replaceChild = function (child, oldChild) {
		delete oldChild.parent;
		child.parent = this;
		this.children.splice(oldChild.index, 1, child);
		child.index = oldChild.index;
		
		this.body.replaceChild(child.element, oldChild.element);
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
	
	prototype.fromJSON = function (container, json) {
		var length = json.children.length;
		for (var i = 0; i < length; i++) {
			var child = json.children[i];
			switch (child.type) {
				case Pane.TYPE:
				var newPane = Pane.fromJSON(container, child);
				newPane.size = child.size;
				this.appendChild(newPane);
				break;
				
				case Sub.TYPE:
				var newSub = Sub.fromJSON(container, child);
				newSub.size = child.size;
				this.appendChild(newSub);
				break;
			}
		}
	};
	
	return PaneBase;
})(Multiple);

var DockPane = _(function (Base, base) {
	
	function DockPane(dock, last) {
		Base.call(this, 'dockpane', dock.horizontal);
		this.parent = dock;
		
		this.size = 0;
		this.last = last;
	}
	var prototype = inherit(DockPane, base);
	
	function Drag(dockPane, container) {
		this.container = container;
		var size = this.container.size;
		var min  = this.container.minSize;
		var rem = dockPane.horizontal
			? size.width  - min.width
			: size.height - min.height;
		this.maxSize = dockPane.size + rem;
	}
	
	prototype.onSplitterDragStart = function (splitter) {
		var inner = this.last ? 0 : this.children.length - 1;
		if (splitter.index == inner) {
			this.drag = new Drag(this, splitter.container);
		}
	};
	prototype.onSplitterDrag = function (i, delta) {
		var child = this.children[i];
		if (this.last) delta = -delta;
		
		if (delta < -child.size) delta = -child.size;
		var drag = this.drag;
		if (drag) {
			if (delta < -this.size) delta = this.size;
			var rem = drag.maxSize - this.size;
			if (rem < delta) delta = rem;
			this.size  += delta;
			child.size += delta;
			
			drag.container.updateMinSize();
		} else {
			var next = this.children[this.last ? i - 1 : i + 1];
			if (delta > next.size) delta = next.size;
			child.size += delta;
			next .size -= delta;
		}
		return this.last ? -delta : delta;
	};
	prototype.onSplitterDrop = function () {
		delete this.drag;
	};
	
	prototype.merge = function (dockPane) {
		var i, length = dockPane.children.length;
		if (this.last) {
			for (i = length - 1; i >= 0; i--) {
				this.prependChild(dockPane.children[i]);
			}
		} else {
			for (i = 0; i < length; i++) {
				this.appendChild(dockPane.children[i]);
			}
		}
	};
	
	prototype.expand = function (child) {
		this.size += child.size + Splitter.SIZE;
	};
	prototype.appendChild = function (child) {
		this.expand(child);
		if (this.last) {
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
			child.index + this.last,
			refChild.element);
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
	}
	var prototype = inherit(Pane, base);
	
	Pane.TYPE = 'pane';
	
	function Drag() { }
	
	Pane.fromJSON = function (container, json) {
		var pane = new Pane(json.horizontal);
		pane.fromJSON(container, json);
		return pane;
	};
	
	prototype.onSplitterDragStart = function (splitter) {
		if (this.remSize == 0) {
			this.drag = new Drag();
			return;
		}
		this.calcSizes();
	};
	prototype.onSplitterDrag = function (i, delta) {
		if (this.drag) return;
		var n = i + 1;
		
		var cSize = this.sizes[i];
		var nSize = this.sizes[n];
		
		if (delta < -cSize) delta = -cSize;
		if (delta >  nSize) delta =  nSize;
		
		this.children[i].size = (cSize + delta) / this.remSize;
		this.children[n].size = (nSize - delta) / this.remSize;
		
		return delta;
	};
	prototype.onSplitterDrop = function () {
		delete this.drag;
	};
	
	prototype.merge = function (pane, ref) {
		var length = pane.children.length;
		this.remSize -= Splitter.SIZE * (length - 1);
		this.calcSizes();
		
		for (var i = 0; i < length; i++) {
			var child = pane.children[i];
			child.size = pane.sizes[i] / this.remSize;
			this.insertChild(child, ref);
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
			
			var size = this.sizes[index] + Splitter.SIZE;
			var ls = this.children[li].size;
			var rs = this.children[ri].size;
			var sum = ls + rs;
			if (sum == 0.) { sum = 1.; ls = rs = .5; }
			
			this.remSize += Splitter.SIZE;
			this.sizes.splice(index, 1);
			this.sizes[li] += size * ls / sum;
			this.sizes[ri] += size * rs / sum;
			this.calcSizes();
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
			this.children[i].size =
				this.sizes[i] / this.remSize;
		}
	};
	
	prototype.divideSizes = function (size) {
		this.remSize = size < 0 ? 0 : size;
		var division = new Division(this.remSize);
		var length = this.children.length;
		for (var i = 0; i < length; i++) {
			division.set(i, this.children[i].size);
		}
		this.sizes = division.get();
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
		
		var length = this.children.length;
		for (var i = Math.min(index, to); i < length; i++) {
			this.children[i].index = i;
		}
	};
	
	prototype.deactivateAll = function () {
		var length = this.children.length;
		for (var i = 0; i < length; i++) {
			this.children[i].deactivating();
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
	
	var MIN_SIZE = new Size(
		TabStrip.MAIN,
		TabStrip.MAIN);
	var TAB_SIZE = 120; // px const
	
	Main.TYPE = 'main';
	
	Main.fromJSON = function (container, json) {
		var main = new Main();
		main.fromJSON(container, json);
		return main;
	};
	
	prototype.getMain = function () {
		return this;
	};
	
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
	
	prototype.toJSON = function () {
		var children = []; var active = 0;
		
		if (this.active) {
			var index = this.active.index;
			var length = this.children.length;
			for (var i = 0; i < length; i++) {
				var child = this.children[i];
				if (child.src) {
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
	
	var TAB_SIZE = 112; // px const
	
	Sub.TYPE = 'sub';
	
	Sub.fromJSON = function (container, json) {
		var sub = new Sub();
		sub.fromJSON(container, json);
		return sub;
	};
	
	function max(delta, rect) {
		return delta.max(new Vector(
			Frame.MIN_R - rect.right(),
			Edge.SIZE   - rect.top));
	}
	
	prototype.detached = null;
	
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
	
	prototype.openFloat = function (container, rect, delta) {
		var frame = new Frame(this);
		delta = max(delta, rect);
		frame.rect = rect.plus(delta).max(TabStrip.HEIGHT);
		
		container.floats.appendChild(frame);
		frame.activate();
		return delta;
	};
	
	prototype.onStripDragStart = function () {
		this.tabstrip.addGrabbingClass();
		this.tabstrip.container.guide.ondragstart(this);
	};
	prototype.onStripDrag = function (delta) {
		var container = this.tabstrip.container;
		
		if (this.parent instanceof Frame) {
			var r = this.parent.rect;
			delta = max(delta, r);
			this.parent.moveTo(r.plus(delta));
			
			container.guide.ondrag();
			return delta;
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
		this.tabstrip.onresize(this.width,
			TAB_SIZE, TabStrip.HEIGHT);
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
	
	function attr(iframe, options, key, test) {
		if (options != null && key in options) {
			return options[key];
		}
		var name = DATA_PREFIX + key;
		return test ?
			iframe.hasAttribute(name) :
			iframe.getAttribute(name);
	}
	
	function Content(iframe, options) {
		Base.call(this, 'content');
		
		var self = this;
		
		this.iframe = iframe;
		
		this.src = options instanceof Options;
		if (this.src) {
			this.id = options.id;
			options = null;
		}
		this.title = attr(iframe, options, 'title', false);
		var  fixed = attr(iframe, options, 'fixed', true);
		
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
			var iframe = this.iframe;
			try {
				title = iframe.contentDocument.title;
				if (title) return title;
			} catch (_) { }
			title = this.id || iframe.src;
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
	prototype.activating = function () {
		this.addActiveClass();
		this.tab.addActiveClass();
		this.setHidden(false);
	};
	prototype.deactivating = function () {
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
		this.deactivating();
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
	
	var DIFF = new Vector(
		TabStrip.HEIGHT,
		TabStrip.HEIGHT);
	
	function test(floats, rect) {
		var children = floats.children;
		var length = children.length;
		for (var i = 0; i < length; i++) {
			var child = children[i];
			if (child.rect.equals(rect)) return true;
		}
		return false;
	}
	function move(floats, rect, size) {
		while (test(floats, rect)) {
			var diff = new Vector(
				size.width  - rect.right(),
				size.height - rect.bottom())
				.max(Vector.ZERO).min(DIFF);
			if (diff.equals(Vector.ZERO)) break;
			rect = rect.plus(diff);
		}
		return rect;
	}
	
	prototype.open = function (element) {
		var content = new Content(element);
		this.openMain(content);
		return content;
	};
	
	prototype.openMain = function (content) {
		if (content.isClosed()) {
			this.layout.getMain().appendChild(content, false);
		}
		content.activate();
	};
	prototype.openSub = function (content, rect) {
		if (content.isClosed()) {
			var r = rect == null ? new Rect : Rect.from(rect);
			var s = this.layout.cSize;
			
			if (!r.width ) r.width  = 300;
			if (!r.height) r.height = 200;
			if (r.top  == null) {
				r.top  = (s.height - r.height) / 2;
			}
			if (r.left == null) {
				r.left = (s.width  - r.width)  / 2;
			}
			r = move(this.layout.floats,
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
