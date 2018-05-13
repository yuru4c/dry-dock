var DryDock = (function () {

var NAME_PREFIX = 'dd-';

var $ = document;

function blur() {
	var element = $.activeElement;
	if (element == null
	 || element == $.documentElement
	 || element == $.body) return;
	element.blur();
}
function createDiv(className) {
	var div = $.createElement('div');
	div.className = NAME_PREFIX + className;
	return div;
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
	
	prototype.max = function (x, y) {
		return new Vector(
			Math.max(this.x, x),
			Math.max(this.y, y));
	};
	
	prototype.abs2 = function () {
		return this.x * this.x +
		       this.y * this.y;
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
	Size.square = function (value) {
		return new Size(value, value);
	};
	
	prototype.max = function (size) {
		return new Size(
			Math.max(this.width,  size.width),
			Math.max(this.height, size.height));
	};
	
	prototype.minus = function (value) {
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
			rect.width  || rect.right  - rect.left,
			rect.height || rect.bottom - rect.top);
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
	
	prototype.contains = function (vector) {
		return this.left <= vector.x
		    && this.top  <= vector.y
		    && vector.x < this.left + this.width
		    && vector.y < this.top  + this.height;
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
			var cursor = CURSORS[i][j];
			if (cursor) {
				object.forEdgeDef(VS[i], HS[j], cursor);
			}
		}}
	};
	
	return EdgeDef;
})();


var ButtonDef = (function () {
	
	function ButtonDef(char, horizontal, last) {
		this.char = char;
		this.horizontal = horizontal;
		this.last = last;
	}
	var prototype = ButtonDef.prototype;
	
	ButtonDef.TOP    = new ButtonDef('↑', false, false);
	ButtonDef.RIGHT  = new ButtonDef('→', true,  true);
	ButtonDef.BOTTOM = new ButtonDef('↓', false, true);
	ButtonDef.LEFT   = new ButtonDef('←', true,  false);
	ButtonDef.CENTER = new ButtonDef('＋', false, false);
	
	prototype.sizeOf = function (rect) {
		var dim = this.horizontal ? rect.width : rect.height;
		return dim - Splitter.SIZE;
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


var Division = (function () {
	
	function Division(value) {
		this.value = value;
		this.sum   = 0;
		this.rounds = [];
		this.values = [];
	}
	var prototype = Division.prototype;
	
	function Round(index, value, decimal) {
		this.index = index;
		this.value = value;
		this.decimal = decimal;
	}
	function compare(a, b) {
		return b.decimal - a.decimal
		    || a.value - b.value
		    || b.index - a.index;
	}
	
	prototype.set = function (i, prop) {
		var value = this.value * prop;
		var floor = Math.floor(value);
		
		this.sum      += floor;
		this.values[i] = floor;
		this.rounds[i] = new Round(i, prop, value - floor);
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
	
	prototype.bodyRect = false;
	prototype.getRect = function () {
		var element = this.bodyRect ? this.body : this.element;
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


var Parts = _(function (Base, base) {
	
	function Parts(className, parent) {
		Base.call(this, className);
		
		this.parent = parent;
	}
	var prototype = inherit(Parts, base);
	
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
	
	return Parts;
})(Model);

var Draggable = _(function (Base, base) {
	
	function Draggable(className, parent) {
		Base.call(this, className, parent);
		
		var self = this;
		function mousedown(event) {
			var ie = !event;
			if (ie) event = window.event;
			var target = event.target || event.srcElement;
			if (target == this || target == self.body) {
				
				if (event.button > ie) {
					self.activate();
				} else {
					var container = self.getContainer();
					container.setDragging(self);
					container.mousedown(event);
				}
				return false;
			}
		}
		this.element.onmousedown = mousedown;
		this.element.ontouchstart = Draggable.toTouch(mousedown);
	}
	var prototype = inherit(Draggable, base);
	
	Draggable.ABS2 = 6 * 6;
	
	Draggable.toTouch = function (listener) {
		return function (event) {
			return listener.call(this, event.touches[0]);
		};
	};
	
	var GRABBING_NAME = NAME_PREFIX + 'grabbing';
	
	prototype.hardDrag = false;
	prototype.cursor = '';
	
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
	prototype.ondrag = function (delta) { };
	prototype.ondrop = function () { };
	
	return Draggable;
})(Parts);

var Splitter = _(function (Base, base) {
	
	function Splitter(pane, index) {
		Base.call(this, 'splitter', pane);
		
		this.index = index;
		this.cursor = pane.horizontal ?
			'ew-resize' : 'ns-resize';
		this.element.style.cursor = this.cursor;
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
		var d = this.parent.horizontal ? delta.x : delta.y;
		if (this.parent.last) d = -d;
		
		var e = this.parent.onSplitterDrag(this.index, d);
		
		if (this.parent.last) e = -e;
		if (e) this.container.layout();
		
		return this.parent.horizontal
			? new Vector(e, delta.y)
			: new Vector(delta.x, e);
	};
	prototype.ondrop = function () {
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
	
	prototype.hardDrag = true;
	
	prototype.appendTab = function (tab) {
		tab.tabstrip = this;
		tab.index = this.tabs.length;
		this.tabs.push(tab);
		this.body.appendChild(tab.element);
	};
	prototype.removeTab = function (tab) {
		tab.tabstrip = null;
		this.tabs.splice(tab.index, 1);
		var length = this.tabs.length;
		for (var i = 0; i < length; i++) {
			this.tabs[i].index = i;
		}
		this.body.removeChild(tab.element);
	};
	
	prototype.onTabDrag = function (tab, x) {
		var l = this.tabs.length;
		
		var toIndex = tab.index + Math.round(x / this.tabSize);
		if (toIndex <  0) toIndex = 0;
		if (toIndex >= l) toIndex = l - 1;
		if (toIndex == tab.index) return x;
		
		var move = toIndex - tab.index;
		var minus = move < 0;
		
		var to = this.tabs[toIndex];
		this.tabs.splice(tab.index, 1);
		this.tabs.splice(toIndex, 0, tab);
		
		this.parent.moveChild(tab.index, toIndex);
		for (var i = minus ? toIndex : tab.index; i < l; i++) {
			this.tabs[i].index = i;
		}
		
		this.body.insertBefore(tab.element,
			minus ? to.element : to.element.nextSibling);
		
		return x - this.tabSize * move;
	};
	
	prototype.onmousedown = function () {
		base.onmousedown.call(this);
		this.parent.onStripMousedown();
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
			if (margin) tabSize = this.tabSize;
			else {
				rem = size % length;
				tabSize = Math.floor(this.tabSize);
			}
		} else this.tabSize = tabSize;
		
		if (rem) {
			this.setEachSize(0, rem, tabSize + 1);
		}
		this.setEachSize(rem, length, tabSize);
	};
	prototype.setEachSize = function (index, length, size) {
		var width = size + 'px';
		for (var i = index; i < length; i++) {
			this.tabs[i].element.style.width = width;
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
	
	Tab.HEIGHT = 26; // px const
	Tab.MAIN = Tab.HEIGHT + 2; // px const
	
	prototype.hardDrag = true;
	
	prototype.setTitle = function (title) {
		this.element.title = title;
		this.textNode.data = title;
	};
	
	prototype.ondragstart = function () {
		this.contents = this.tabstrip.parent;
		this.diff = this.contents.detatchChild && Vector.ZERO;
		this.x = 0;
		this.addGrabbingClass();
	};
	prototype.ondrag = function (delta) {
		var diff = this.diff;
		if (diff) {
			this.diff = diff.plus(delta);
			if (Math.abs(this.diff.y) >= Tab.HEIGHT) {
				return this.contents.detatchChild(
					this.parent, this.diff).minus(diff);
			}
		}
		this.x = this.tabstrip.onTabDrag(this, this.x + delta.x);
		this.element.style.left = this.x + 'px';
	};
	prototype.ondrop = function () {
		this.removeGrabbingClass();
		this.element.style.left = '';
	};
	
	return Tab;
})(Draggable);

var Close = _(function (Base, base) {
	
	function Close(tab, content) {
		Base.call(this, 'close', tab);
		
		this.content = content;
		// DOM
		this.body.appendChild($.createTextNode('×'));
	}
	var prototype = inherit(Close, base);
	
	var CANCEL_NAME = NAME_PREFIX + 'cancel';
	
	prototype.tagName = 'a';
	
	prototype.test = function () {
		return this.cRect.contains(this.container.dragPrev);
	};
	
	prototype.onmousedown = function () {
		this.cRect = this.getRect();
		this.hovering = true;
		this.addActiveClass();
		blur();
	};
	prototype.ondrag = function () {
		var hovering = this.test();
		if (hovering != this.hovering) {
			if (hovering) {
				this.addActiveClass();
				this.removeClass(CANCEL_NAME);
			} else {
				this.removeActiveClass();
				this.addClass(CANCEL_NAME);
			}
			this.hovering = hovering;
		}
	};
	prototype.ondrop = function () {
		if (this.hovering) {
			this.content.close();
			this.removeActiveClass();
		} else {
			this.removeClass(CANCEL_NAME);
		}
	};
	
	return Close;
})(Draggable);

var Edge = _(function (Base, base) {
	
	function Edge(float, v, h, cursor) {
		Base.call(this, 'edge', float);
		
		this.v = v;
		this.h = h;
		this.cursor = cursor;
		
		this.addClass(v.className);
		this.addClass(h.className);
		this.element.style.cursor = cursor;
	}
	var prototype = inherit(Edge, base);
	
	Edge.SIZE = 2;
	var MIN = Edge.SIZE + Tab.HEIGHT;
	
	prototype.ondrag = function (delta) {
		var dx = delta.x, dy = delta.y;
		
		var rect = this.parent.rect;
		var mw = rect.width  - Tab.HEIGHT;
		var mh = rect.height - Tab.HEIGHT;
		
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
			var r = MIN - rect.left - rect.width;
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
		
		// DOM
		this.hide();
		
		this.body.appendChild(this.area.element);
		
		this.body.appendChild(this.top   .element);
		this.body.appendChild(this.right .element);
		this.body.appendChild(this.bottom.element);
		this.body.appendChild(this.left  .element);
	}
	var prototype = inherit(GuideBase, base);
	
	prototype.getButton = function (vector) {
		if (this.top   .hitTest(vector)) return this.top;
		if (this.right .hitTest(vector)) return this.right;
		if (this.bottom.hitTest(vector)) return this.bottom;
		if (this.left  .hitTest(vector)) return this.left;
		return null;
	};
	prototype.setButton = function (button) {
		if (button == this.button) return;
		if (this.button) this.button.onleave();
		this.button = button;
		if (button) {
			button.onenter();
			this.enter(button.def);
			this.area.show();
		} else {
			this.area.hide();
		}
	};
	
	prototype.drop = function (contents, target) {
		if (target) this.button.ondrop(contents, target);
		this.button.onleave();
		this.button = null;
		this.area.hide();
	};
	
	return GuideBase;
})(Parts);

var GuideParent = _(function (Base, base) {
	
	function GuideParent(parent) {
		Base.call(this, 'guide', parent, parent);
		
		this.child = new Guide(this);
		this.body.appendChild(this.child.element);
	}
	var prototype = inherit(GuideParent, base);
	
	prototype.onmousedown = function (contents) {
		this.contents = contents;
		this.firstDrag = true;
	};
	prototype.ondrag = function () {
		if (this.firstDrag) {
			this.container.calcRect();
			var pos = new ButtonPos(this.container.cRect);
			
			this.top   .setPos(pos.f.y, pos.c.x);
			this.right .setPos(pos.c.y, pos.l.x);
			this.bottom.setPos(pos.l.y, pos.c.x);
			this.left  .setPos(pos.c.y, pos.f.x);
			
			this.show();
			this.firstDrag = false;
		}
		
		var dragPrev = this.container.dragPrev;
		
		var target = this.container.getChild(dragPrev);
		if (target != this.target) {
			this.target = target;
			if (target) this.child.onenter(target);
			else this.child.hide();
		}
		var result = false;
		if (target) {
			var relative = dragPrev.of(target.cRect);
			result = this.child.ondrag(relative);
		}
		
		this.setButton(result ? null :
			this.getButton(dragPrev.of(this.container.cRect)));
	};
	prototype.enter = function (def) {
		this.area.setOuterArea(def, this.container.cRect);
	};
	prototype.ondrop = function () {
		if (this.button) {
			this.drop(this.contents, this.container);
		} else {
			this.child.ondrop(this.contents, this.target);
		}
		this.child.hide();
		this.hide();
		this.target = null;
	};
	
	return GuideParent;
})(GuideBase);

var Guide = _(function (Base, base) {
	
	function Guide(parent) {
		Base.call(this, 'guidepane', parent, parent.container);
		
		this.center = new GuideButton(this, ButtonDef.CENTER);
		this.body.appendChild(this.center.element);
	}
	var prototype = inherit(Guide, base);
	
	prototype.onenter = function (target) {
		this.rect = target.cRect.of(this.container.cRect);
		this.setRect(this.rect);
		
		var c = ButtonPos.center(this.rect);
		this.top   .setPos(c.y - GuideButton.SM, c.x);
		this.right .setPos(c.y, c.x + GuideButton.SM);
		this.bottom.setPos(c.y + GuideButton.SM, c.x);
		this.left  .setPos(c.y, c.x - GuideButton.SM);
		this.center.setPos(c.y, c.x);
		
		var float = target.parent instanceof Float;
		this.main = target instanceof Main;
		this.top   .setDisable(float);
		this.right .setDisable(float);
		this.bottom.setDisable(float);
		this.left  .setDisable(float);
		this.center.setDisable(this.main);
		
		this.show();
	};
	prototype.ondrag = function (vector) { // 相対座標
		var button = this.getButton(vector);
		this.setButton(button);
		return button ? true : false;
	};
	prototype.enter = function (def) {
		if (this.main) {
			this.area.setMainArea(def, this.rect);
		} else {
			this.area.setArea(def, this.rect);
		}
	};
	prototype.ondrop = function (contents, target) {
		if (this.button) this.drop(contents, target);
	};
	
	prototype.getButton = function (vector) {
		var button = base.getButton.call(this, vector);
		if (button) return button;
		if (this.center.hitTest(vector)) return this.center;
		return null;
	};
	
	return Guide;
})(GuideBase);

var GuideButton = _(function (Base, base) {
	
	function GuideButton(parent, def) {
		Base.call(this, 'guidebutton', parent);
		
		this.container = parent.container;
		this.def = def;
		
		this.body.appendChild($.createTextNode(def.char));
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
	
	prototype.ondrop = function (contents, target) {
		var parent = target.parent;
		contents.parent.removeChild(contents, true);
		
		if (this.def == ButtonDef.CENTER) { // タブ追加
			this.mergeTabs(contents, target);
		} else
		if (target == this.container) { // 外側
			this.outer(contents, target, target.child);
			this.container.updateMinSize();
		} else
		if (target instanceof Main) { // Dock 追加
			this.dockPane(contents, target, parent);
			this.container.updateMinSize();
		} else {
			this.pane(contents, target, parent);
		}
		
		target.activate();
		this.container.layout();
		if (parent instanceof Float) parent.layout();
	};
	
	prototype.test = function (layout) {
		return layout instanceof Dock &&
			layout.horizontal == this.def.horizontal;
	};
	prototype.newPane = function (contents, layout, divisor) {
		contents.size = 1.;
		var pane = new Pane(!this.def.horizontal);
		var size = this.def.sizeOf(layout.cRect);
		
		pane.size = Math.floor(size / divisor);
		pane.appendChild(contents);
		return pane;
	};
	prototype.newDock = function (child, pane) {
		var dock = new Dock(this.def.horizontal);
		dock.setChild(child);
		(this.def.last ?
			dock.lasts : dock.firsts).appendChild(pane);
		return dock;
	};
	
	prototype.mergeTabs = function (contents, target) {
		var active = contents.active;
		var length = contents.children.length;
		for (var i = 0; i < length; i++) {
			target.appendChild(contents.children[i], true);
		}
		target.activateChild(active);
	};
	
	prototype.outer = function (contents, container, child) {
		var pane = this.newPane(contents, child, 5);
		if (this.test(child)) {
			if (this.def.last) {
				child.lasts.appendChild(pane);
			} else {
				child.firsts.prependChild(pane, true);
			}
		} else {
			container.removeChild();
			container.setChild(this.newDock(child, pane));
		}
	};
	prototype.dockPane = function (contents, target, parent) {
		var pane = this.newPane(contents, target, 3);
		if (this.test(parent)) {
			if (this.def.last) {
				parent.lasts.prependChild(pane, true);
			} else {
				parent.firsts.appendChild(pane);
			}
		} else {
			parent.removeChild();
			parent.setChild(this.newDock(target, pane));
		}
	};
	prototype.pane = function (contents, target, parent) {
		if (parent.horizontal == this.def.horizontal) {
			contents.size = target.size /= 2;
			parent.insertChild(contents,
				this.def.last ?
					parent.children[target.index + 1] :
					target);
		} else {
			var refChild = parent.children[target.index + 1];
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
			
			parent.insertChild(pane, refChild);
		}
	};
	
	return GuideButton;
})(Parts);

var GuideArea = _(function (Base, base) {
	
	function GuideArea(parent) {
		Base.call(this, 'guidearea', parent);
		
		this.hide();
	}
	var prototype = inherit(GuideArea, base);
	
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
	
	return GuideArea;
})(Parts);


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

var Immutable = _(function (Base, base) {
	
	function Immutable(className) {
		Base.call(this, className);
	}
	var prototype = inherit(Immutable, base);
	
	prototype.calcRect = function () {
		this.cRect = this.getRect();
		this.child.calcRect();
	};
	
	prototype.setChild = function (child) {
		this.child = child;
		child.parent = this;
		this.body.appendChild(child.element);
	};
	prototype.removeChild = function () {
		this.child.parent = null;
		this.body.removeChild(this.child.element);
		this.child = null;
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.child = this.child;
		return json;
	};
	
	return Immutable;
})(Layout);

var Mutable = _(function (Base, base) {
	
	function Mutable(className) {
		Base.call(this, className);
		
		this.children = [];
	}
	var prototype = inherit(Mutable, base);
	
	prototype.calcRect = function () {
		this.cRect = this.getRect();
		var length = this.children.length;
		for (var i = 0; i < length; i++) {
			this.children[i].calcRect();
		}
	};
	prototype.getChild = function (client) {
		if (this.cRect.contains(client)) {
			var length = this.children.length;
			for (var i = 0; i < length; i++) {
				var child = this.children[i].getChild(client);
				if (child) return child;
			}
		}
		return null;
	};
	
	prototype.appendChild = function (child) {
		child.parent = this;
		child.index = this.children.length;
		this.children.push(child);
		
		this.body.appendChild(child.element);
	};
	prototype.removeChild = function (child) {
		child.parent = null;
		this.children.splice(child.index, 1);
		var length = this.children.length;
		for (var i = child.index; i < length; i++) {
			this.children[i].index = i;
		}
		this.body.removeChild(child.element);
		
		if (length && child == this.active) {
			var index = child.index;
			if (index == length) index = length - 1;
			this.activateChild(this.children[index]);
		}
	};
	prototype.replaceChild = function (child, oldChild) {
		oldChild.parent = null;
		child.parent = this;
		this.children.splice(oldChild.index, 1, child);
		child.index = oldChild.index;
		
		this.body.replaceChild(child.element, oldChild.element);
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
	
	prototype.activateChild = function (child) {
		if (this.active) this.active.deactivateSelf();
		this.active = child;
		child.activateSelf();
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
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.children = this.children;
		return json;
	};
	
	return Mutable;
})(Layout);


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
			case 'dock':
			this.setChild(Dock.fromJSON(container, child));
			break;
			
			case 'main':
			this.setChild(Main.fromJSON(container, child));
			break;
		}
	};
	
	return DockBase;
})(Immutable);

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
			if (node.nodeType == 1) {
				var id = node.id;
				if (id) this.contents[id] = new Content(node, id);
			}
			node = next;
		}
		
		this.body    = createDiv('body');
		this.overlay = createDiv('overlay');
		this.floats = new Floats(this);
		this.guide  = new GuideParent(this);
		
		this.element.appendChild(this.body);
		this.element.appendChild(this.floats.element);
		this.element.appendChild(this.guide.element);
		this.element.appendChild(this.overlay);
		this.element.onmousedown = function (event) {
			event = event || window.event;
			var target = event.target || event.srcElement;
			if (target == this) {
				self.activate();
				return false;
			}
		};
		
		element.appendChild(this.element);
		
		this.mousemove = function (event) {
			event = event || window.event;
			var vector = Vector.from(event);
			if (self.hardDrag) {
				var abs2 = vector.minus(self.dragStart).abs2();
				if (abs2 < Draggable.ABS2) return false;
				self.hardDrag = false;
			}
			
			var diff = vector.minus(self.dragPrev);
			self.dragPrev = vector;
			
			if (self.firstDrag) {
				self.dragging.ondragstart();
				self.firstDrag = false;
			}
			var sumDiff = self.dragDiff.plus(diff);
			var resDiff = self.dragging.ondrag(sumDiff);
			self.dragDiff = resDiff ?
				sumDiff.minus(resDiff) : Vector.ZERO;
			return false;
		};
		this.mouseup = function () {
			this.onmousemove = null;
			this.onmouseup   = null;
			this.ontouchmove = null;
			this.ontouchend  = null;
			self.removeClass(DRAGGING_NAME);
			self.setDragging(null);
		};
		this.touchmove = Draggable.toTouch(this.mousemove);
		this.touchend  = Draggable.toTouch(this.mouseup);
	}
	var prototype = inherit(Container, base);
	
	Container.MARGIN = 6; // px const
	Container.M2 = Container.MARGIN * 2;
	Container.PX = Container.MARGIN + 'px';
	
	prototype.setDragging = function (draggable) {
		if (this.dragging) {
			this.dragging.ondrop();
			this.dragging.container = null;
		}
		if (draggable) draggable.container = this;
		this.dragging = draggable;
	};
	prototype.mousedown = function (event) {
		this.dragStart = this.dragPrev = Vector.from(event);
		this.hardDrag  = this.dragging.hardDrag;
		this.firstDrag = true;
		this.dragDiff  = Vector.ZERO;
		
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
	prototype.getChild = function (client) {
		if (this.cRect.contains(client)) {
			var child = this.floats.getChild(client);
			if (child) {
				if (child instanceof Float) return null;
				return child;
			}
			return this.child.getChild(client);
		}
		return null;
	};
	
	prototype.activateFloats = function () {
		this.addClass(FLOATING_NAME);
		blur();
	};
	prototype.activate = function () { // stop bubbling
		this.removeClass(FLOATING_NAME);
		blur();
	};
	
	prototype.onresize = function () {
		this.clientSize = Size.from(this.element);
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
		this.size = this.clientSize
			.minus(Container.M2).max(this.minSize);
	};
	prototype.layout = function () {
		this.child.onresize(this.size.width, this.size.height);
	};
	
	prototype.getContainer = function () {
		return this;
	};
	
	prototype.init = function () {
		if (this.child) {
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
		
		var self = this;
		this.parent = container;
	}
	var prototype = inherit(Floats, base);
	
	prototype.appendChild = function (float) {
		float.setZ(this.children.length);
		base.appendChild.call(this, float);
		float.layout();
	};
	prototype.removeChild = function (float, pauseLayout) {
		base.removeChild.call(this, float);
		if (pauseLayout) return;
		
		var length = this.children.length;
		for (var i = float.index; i < length; i++) {
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
	}
	prototype.getChild = function (client) {
		for (var i = this.children.length - 2; i >= 0; i--) {
			var child = this.children[i].getChild(client);
			if (child) return child;
		}
		return null;
	};
	
	prototype.activateChild = function (float) {
		base.activateChild.call(this, float);
		
		this.children.splice(float.index, 1);
		this.children.push(float);
		
		var length = this.children.length;
		for (var i = float.index; i < length; i++) {
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
			var float = Float.fromJSON(container, child);
			this.appendChild(float);
		}
	};
	
	return Floats;
})(Mutable);

var Float = _(function (Base, base) {
	
	function Float(sub) {
		Base.call(this, 'float');
		
		delete sub.size;
		
		// DOM
		this.body = createDiv('fbody');
		this.setChild(sub);
		
		this.element.appendChild(this.body);
		EdgeDef.forEach(this);
	}
	var prototype = inherit(Float, base);
	
	var HANDLE = 6; // px const
	var H2 = HANDLE * 2;
	
	Float.fromJSON = function (container, json) {
		var sub = Sub.fromJSON(container, json.child);
		var float = new Float(sub);
		float.rect = Rect.from(json.rect);
		return float;
	};
	
	prototype.forEdgeDef = function (v, h, cursor) {
		var edge = new Edge(this, v, h, cursor);
		this.element.appendChild(edge.element);
	};
	
	prototype.setZ = function (zIndex) {
		this.element.style.zIndex = zIndex;
	};
	
	prototype.removeChild = function (sub, pauseLayout) {
		this.parent.removeChild(this, pauseLayout);
	};
	
	prototype.bodyRect = true;
	
	prototype.getChild = function (client) {
		if (this.cRect.contains(client)) {
			return this.child.getChild(client) || this;
		}
		return null;
	};
	
	prototype.onActivate = function () {
		this.parent.activateChild(this);
	};
	prototype.activateSelf = function () {
		this.addActiveClass();
	};
	prototype.deactivateSelf = function () {
		this.removeActiveClass();
	};
	
	prototype.layout = function () {
		this.setRect(new Rect(
			this.rect.top  - HANDLE,
			this.rect.left - HANDLE,
			this.rect.width  + H2,
			this.rect.height + H2));
		this.child.layout(this.rect.width);
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.rect = this.rect;
		return json;
	};
	
	return Float;
})(Immutable);

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
			return;
		}
		parent.setChild(this.child);
	};
	
	prototype.calcRect = function () {
		base.calcRect.call(this);
		this.firsts.calcRect();
		this.lasts .calcRect();
	};
	prototype.getChild = function (client) {
		if (this.cRect.contains(client)) {
			return this.child .getChild(client)
			    || this.firsts.getChild(client)
			    || this.lasts .getChild(client);
		}
		return null;
	};
	
	prototype.setChild = function (child) {
		this.child = child; // Dock | Main
		child.parent = this;
		this.body.insertBefore(child.element, this.lasts.element);
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
		json.type = 'dock';
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
	
	return PaneBase;
})(Mutable);

var DockPane = _(function (Base, base) {
	
	function DockPane(dock, last) {
		Base.call(this, 'dockpane', dock.horizontal);
		this.parent = dock;
		
		this.size = 0;
		this.last = last;
	}
	var prototype = inherit(DockPane, base);
	
	prototype.onSplitterDragStart = function (splitter) {
		var inner = this.last ? 0 : this.children.length - 1;
		this.draggingInner = splitter.index == inner;
		
		if (this.draggingInner) {
			this.container = splitter.container;
			var size = this.container.size;
			var min  = this.container.minSize;
			var rem = this.horizontal
				? size.width  - min.width
				: size.height - min.height;
			this.maxSize = this.size + rem;
		}
	};
	prototype.onSplitterDrag = function (i, delta) {
		var child = this.children[i];
		if (delta < -child.size) delta = -child.size;
		
		if (this.draggingInner) {
			if (delta < -this.size) delta = this.size;
			var rem = this.maxSize - this.size;
			if (rem < delta) delta = rem;
			this.size  += delta;
			child.size += delta;
			
			this.container.updateMinSize();
		} else {
			var next = this.children[this.last ? i - 1 : i + 1];
			if (delta > next.size) delta = next.size;
			child.size += delta;
			next .size -= delta;
		}
		
		return delta;
	};
	
	prototype.merge = function (dockPane) {
		var i, length = dockPane.children.length;
		if (this.last) {
			for (i = length - 1; i >= 0; i--) {
				this.prependChild(dockPane.children[i], true);
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
	prototype.removeChild = function (child) {
		this.size -= child.size + Splitter.SIZE;
		base.removeChild.call(this, child);
		this.removeSplitter(child.index);
		
		this.parent.onRemove();
	};
	prototype.prependChild = function (child, last) {
		var ref = this.children[0];
		if (ref == null) {
			this.appendChild(child);
			return;
		}
		this.expand(child);
		if (last) {
			var i = ref.index;
			var element = ref.element;
			this.insertChild(child, ref);
			this.insertSplitter(i + this.last, element);
		} else {
			this.insertSplitter(ref.index, ref.element);
			this.insertChild(child, ref);
		}
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
	
	// prototype.getDockPane = function () {
	// 	return this;
	// };
	
	prototype.fromJSON = function (container, json) {
		var length = json.children.length;
		for (var i = 0; i < length; i++) {
			var child = json.children[i];
			var pane = Pane.fromJSON(container, child);
			pane.size = child.size;
			this.appendChild(pane);
		}
	};
	
	return DockPane;
})(PaneBase);

var Pane = _(function (Base, base) {
	
	function Pane(horizontal) {
		Base.call(this, 'pane', horizontal);
		
		// this.sizes = [];
	}
	var prototype = inherit(Pane, base);
	
	Pane.fromJSON = function (container, json) {
		var pane = new Pane(json.horizontal);
		
		var length = json.children.length;
		for (var i = 0; i < length; i++) {
			var child = json.children[i];
			switch (child.type) {
				case 'pane':
				var newPane = Pane.fromJSON(container, child);
				newPane.size = child.size;
				pane.appendChild(newPane);
				break;
				
				case 'contents':
				var newSub = Sub.fromJSON(container, child);
				newSub.size = child.size;
				pane.appendChild(newSub);
				break;
			}
		}
		return pane;
	};
	
	prototype.onSplitterDragStart = function (splitter) {
		if (this.remSize == 0) return;
		
		var length = this.children.length;
		for (var i = 0; i < length; i++) {
			this.children[i].size = this.sizes[i] / this.remSize;
		}
	};
	prototype.onSplitterDrag = function (i, delta) {
		if (this.remSize == 0) return;
		var n = i + 1;
		
		var cSize = this.sizes[i];
		var nSize = this.sizes[n];
		
		if (delta < -cSize) delta = -cSize;
		if (delta >  nSize) delta =  nSize;
		
		this.children[i].size = (cSize + delta) / this.remSize;
		this.children[n].size = (nSize - delta) / this.remSize;
		
		return delta;
	};
	
	prototype.merge = function (pane, ref) {
		this.removeChild(ref, true);
		var refChild = this.children[ref.index];
		var length = pane.children.length;
		for (var j = 0; j < length; j++) {
			var child = pane.children[j];
			child.size *= ref.size;
			this.insertChild(child, refChild);
		}
	};
	
	prototype.appendChild = function (child) {
		if (this.children.length) this.appendSplitter();
		base.appendChild.call(this, child);
	};
	prototype.removeChild = function (child, pauseLayout) {
		base.removeChild.call(this, child);
		if (this.splitters.length) {
			var index = child.index;
			this.removeSplitter(index ? index - 1 : index);
		}
		if (pauseLayout) return;
		
		var container = this.getContainer();
		
		var length = this.children.length;
		if (length == 1 && this.parent instanceof Pane) {
			var remChild = this.children[0];
			if (remChild instanceof Pane) {
				this.parent.merge(remChild, this);
			} else {
				remChild.size = this.size;
				this.parent.replaceChild(remChild, this);
			}
		} else if (length) {
			var i;
			if (this.sizes[child.index] == this.remSize) {
				var prop = 1. / length;
				for (i = 0; i < length; i++) {
					this.children[i].size = prop;
				}
			} else {
				var rem = 1. - child.size;
				for (i = 0; i < length; i++) {
					this.children[i].size /= rem;
				}
			}
		} else {
			this.parent.removeChild(this);
			container.updateMinSize();
		}
		container.layout();
	};
	prototype.insertChild = function (child, refChild) {
		if (refChild == null) {
			this.appendChild(child);
			return;
		}
		base.insertChild.call(this, child, refChild);
		this.insertSplitter(child.index, refChild.element);
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
	
	// prototype.getDockPane = function () {
	// 	return this.parent.getDockPane();
	// };
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.horizontal = this.horizontal;
		json.size = this.size;
		json.type = 'pane';
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
	prototype.removeChild = function (content) {
		base.removeChild.call(this, content);
		
		this.tabstrip.removeTab(content.tab);
		if (this.children.length) this.setTabSize();
	};
	
	prototype.calcRect = function (client) {
		this.cRect = this.getRect();
	};
	prototype.getChild = function (client) {
		if (this.cRect.contains(client)) return this;
		return null;
	};
	
	prototype.onStripMousedown = function () { };
	prototype.onStripDrag = function (delta) { }; // called from Main
	prototype.onStripDrop = function () { };
	
	// prototype.minimize = function () {
	// 	this.parent.getDockPane().minimizeChild(this);
	// };
	
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
})(Mutable);

var Main = _(function (Base, base) {
	
	function Main() {
		Base.call(this, 'main');
	}
	var prototype = inherit(Main, base);
	
	var MIN_SIZE = Size.square(Tab.MAIN);
	
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
	prototype.setTabSize = function () { // px const
		this.tabstrip.onresize(this.width, 120, 0);
	};
	
	prototype.toJSON = function () {
		var children = []; var active = 0;
		
		var index = this.active.index;
		var length = this.children.length;
		for (var i = 0; i < length; i++) {
			var child = this.children[i];
			if (child.id) {
				children.push(child);
				if (i < index) active++;
			}
		}
		if (active == children.length) {
			active = children.length - 1;
		}
		
		return {children: children, active: active, type: 'main'};
	};
	
	return Main;
})(Contents);

var Sub = _(function (Base, base) {
	
	function Sub() {
		Base.call(this, 'sub');
	}
	var prototype = inherit(Sub, base);
	
	Sub.fromJSON = function (container, json) {
		var sub = new Sub();
		sub.fromJSON(container, json);
		return sub;
	};
	
	function max(delta, rect) {
		return delta.max(
			Edge.SIZE - rect.left - rect.width + Tab.HEIGHT,
			Edge.SIZE - rect.top);
	}
	
	prototype.detatchChild = function (content, diff) {
		var container = content.tab.container;
		var rect = this.getRectOf(container);
		this.removeChild(content);
		
		var sub = new Sub();
		sub.appendChild(content, true);
		sub.activateChild(content);
		
		container.setDragging(sub.tabstrip);
		sub.onStripMousedown();
		return sub.openFloat(container, rect, diff);
	};
	
	prototype.openFloat = function (container, rect, delta) {
		var float = new Float(this);
		delta = max(delta, rect);
		float.rect = rect.plus(delta).max(Tab.HEIGHT).round();
		
		container.floats.appendChild(float);
		float.activate();
		return delta;
	};
	
	prototype.onStripMousedown = function () {
		this.tabstrip.container.guide.onmousedown(this);
	};
	prototype.onStripDrag = function (delta) {
		var container = this.tabstrip.container;
		
		if (this.parent instanceof Float) {
			var r = this.parent.rect;
			delta = max(delta, r);
			this.parent.rect = r.plus(delta);
			this.parent.layout();
			
			container.guide.ondrag();
			return delta;
		}
		
		var rect = this.getRectOf(container);
		this.parent.removeChild(this, false);
		this.unsetSize();
		return this.openFloat(container, rect, delta);
	};
	prototype.onStripDrop = function () {
		this.tabstrip.container.guide.ondrop();
	};
	
	prototype.removeChild = function (content) {
		base.removeChild.call(this, content);
		
		if (this.children.length) return;
		this.parent.removeChild(this, false);
	};
	
	prototype.onresize = function (width, height) {
		this.setSize(width, height);
		this.layout(width);
	};
	prototype.layout = function (width) {
		this.width = width;
		this.setTabSize();
	};
	prototype.setTabSize = function () { // px const
		this.tabstrip.onresize(this.width, 112, Tab.HEIGHT);
	};
	
	prototype.toJSON = function () {
		var json = base.toJSON.call(this);
		json.active = this.active.index;
		if (this.parent instanceof Pane) {
			json.size = this.size;
			json.type = 'contents';
		}
		return json;
	};
	
	return Sub;
})(Contents);


var Content = _(function (Base, base) {
	
	var TITLE_NAME = 'data-' + NAME_PREFIX + 'title';
	
	function Content(frame, id) {
		Base.call(this, 'content');
		
		var self = this;
		
		this.frame = frame;
		this.id    = id;
		this.title = frame.getAttribute(TITLE_NAME);
		
		this.tab = new Tab(this);
		
		// DOM
		frame.onload = function () {
			self.updateTitle();
		};
		this.body.appendChild(frame);
	}
	var prototype = inherit(Content, base);
	
	Content.fromJSON = function (container, json) {
		var content = container.contents[json.id];
		content.deactivateSelf();
		return content;
	};
	
	prototype.setTitle = function (title) {
		this.title = title;
		this.updateTitle();
	};
	prototype.getTitle = function () {
		if (this.title) return this.title;
		try {
			var title = this.frame.contentDocument.title;
			if (title) return title;
		} catch (e) { }
		return this.id || this.frame.src || '';
	};
	prototype.updateTitle = function () {
		this.tab.setTitle(this.getTitle());
	};
	
	prototype.onActivate = function () {
		this.parent.activateChild(this);
	};
	prototype.activateSelf = function () {
		this.addActiveClass();
		this.tab.addActiveClass();
	};
	prototype.deactivateSelf = function () {
		this.removeActiveClass();
		this.tab.removeActiveClass();
	};
	
	prototype.onclose = function () { };
	prototype.close = function () {
		if (this.onclose() == false) {
			this.activate();
			return;
		}
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
		
		if (typeof addEventListener == 'function') {
			addEventListener('resize', function () {
				container.onresize();
			});
		}
	}
	var prototype = DryDock.prototype;
	
	DryDock.Container = Container;
	DryDock.Float = Float;
	DryDock.Dock = Dock;
	DryDock.Pane = Pane;
	DryDock.Main = Main;
	DryDock.Sub = Sub;
	DryDock.Content = Content;
	
	function center(value) {
		return value / 2 + Tab.HEIGHT * (Math.random() - .5);
	}
	
	var json = typeof JSON == 'undefined' ? {
		parse: function (json) {
			return eval('(' + json + ')');
		},
		stringify: function stringify(value) {
			switch (typeof value) {
				case 'string': return '"' + value + '"';
				case 'object':
				if (typeof value.toJSON == 'function')
					return stringify(value.toJSON());
				var strs = [];
				if (value instanceof Array) {
					for (var i = 0; i < value.length; i++)
						strs[i] = stringify(value[i]);
					return '[' + strs + ']';
				}
				for (var k in value)
					if (value.hasOwnProperty(k))
						strs.push(
							stringify(k) + ':' +
							stringify(value[k]));
				return '{' + strs + '}';
			}
			return String(value);
		}
	} : JSON;
	
	prototype.open = function (element) {
		var content = new Content(element);
		this.layout.getMain().appendChild(content);
		content.activate();
		return content;
	};
	
	prototype.openMain = function (content) {
		if (content.isClosed()) {
			this.layout.getMain().appendChild(content);
		}
		content.activate();
	};
	prototype.openSub = function (content, rect) {
		if (content.isClosed()) {
			var s = this.layout.clientSize;
			var r = rect ? Rect.from(rect) : new Rect;
			
			r.width  = r.width  || 300;
			r.height = r.height || 200;
			r.top  = r.top  || center(s.height - r.height);
			r.left = r.left || center(s.width  - r.width );
			
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
		return json.stringify(this.layout);
	};
	prototype.restore = function (jsonString) {
		this.layout.init();
		this.layout.fromJSON(json.parse(jsonString));
		this.layout.activate();
		this.layout.onresize();
	};
	
	return DryDock;
})();

})();
