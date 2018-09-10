# DryDock

## 概要
ドッキングウィンドウの JavaScript と CSS による実装です。  
たったの 3000 行程度で書かれており、機能は最低限で軽量です。

## 入門
初期レイアウトを作成する準備をします。
```html
<head>
	<link rel="stylesheet" href="drydock/style.css">
</head>
<body>
	<div id="dock">
		<div id="main" data-dd-title="メイン">メイン</div>
		<div id="sub1" data-dd-title="サブ1">サブ1</div>
		<div id="sub2" data-dd-title="サブ2">サブ2</div>
	</div>
	
	<script src="drydock/script.js"></script>
	<script>
		var dock = document.getElementById('dock');
		var dd = new DryDock(dock);
		
		dd.init();
		dd.openMain(dd.contents['main']);
		dd.openSub(dd.contents['sub1']);
		dd.openSub(dd.contents['sub2']);
	</script>
</body>
```

HTML を開きレイアウトを作成します。  
完成したら、コンソールなどから `dd.serialize()` を実行してください。  
得られた文字列によって復元できます。
```javascript
var dock = document.getElementById('dock');
var dd = new DryDock(dock);

dd.restore('{}'); // dd.serialize() の戻り値を渡す
```

## 使い方
`DryDock` コンストラクタに要素を渡すと、その元で初期化します。  
レイアウトは初期化されないため、復元しない場合は `init` を呼び出します。
```javascript
var dd = new DryDock(element);
dd.init();
```

子要素は取り込まれ、id をキーとして `contents` に格納されます。  
`data-dd-title` 属性でタブのタイトルを設定、  
`data-dd-fixed` 属性で閉じるボタンを隠すことができます。  
これらは以下のようにして開くことができます。
```javascript
var content = dd.contents['id'];

dd.openMain(content);
// または
dd.openSub(content);
```

`openSub` の第二引数には位置と大きさを指定できます。  
すべて任意であり、位置が省略された場合は画面の中央になります。  
また、既存のウィンドウと重なる場合はその右下に開かれます。
```javascript
dd.openSub(content, {
	top: 2, left: 2,
	width: 300, height: 200
});
```

メインタブは指定の要素で開くことができます。  
こうして開かれたタブはシリアライズされません。  
第二引数には任意で、タブのタイトルと閉じるボタンを隠すかどうかを指定できます。
```javascript
var content = dd.open(element, {
	title: 'タイトル', fixed: true
});
```

タイトルは変更できます。
```javascript
content.setTitle('タイトル');
```

`onvisibilitychange` プロパティに関数を設定すると、そのタブの表示状態が変化したときに呼び出されます。  
`hidden` プロパティから隠されているか取得できます。
```javascript
content.onvisibilitychange = function () {
	if (this.hidden) {
		// hidden
	}
};
```

閉じるボタンを隠すかどうか設定できます。
```javascript
content.setFixed(true);
```

タブは閉じることができます。
```javascript
content.close();
```

`onclose` プロパティに関数を設定すると、そのタブを閉じようとしたときに呼び出されます。  
`false` が返されると閉じることをキャンセルします。
```javascript
content.onclose = function () {
	return confirm('閉じますか？');
};
```

タブが閉じられているか確認できます。
```javascript
if (content.isClosed()) {
	// closed
}
```

`serialize`, `restore` メソッドによって、レイアウトのシリアライズや復元が可能です。  
復元する場合、`init` を呼び出す必要はありません。
```javascript
var str = dd.serialize();
dd.restore(str);
```

## 備考
- `dd.layout` を操作することによりレイアウトを制御できます。  
`DryDock` からコンストラクタ `Container`, `Frame`, `Dock`, `Pane`, `Main`, `Sub`, `Content` を取得できます。

- old-browsers ブランチは IE 7 や Safari 5, Opera 12 などで動作を確認しています。  
リサイズイベントを拾わないため、`dd.layout.onresize()` を必要に応じて呼び出してください。  
`JSON` オブジェクトが無かった場合、`restore` はパースに `eval` を使用します。
