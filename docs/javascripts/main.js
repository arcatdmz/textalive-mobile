/// <reference types="@types/jquery" />
define("SongleWidgetAPIClient", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Song {
        constructor(data) {
            this.data = data;
        }
        // public methods
        getSonglePath() {
            return stripProtocol(this.data.permalink);
        }
        getTextAliveUrl() {
            return 'http://textalive.jp/songs/' + createSanitizedPermalink(this.getSonglePath());
        }
        getSanitizedPermalink() {
            return createSanitizedPermalink(this.getSonglePath());
        }
        isNicovideo() {
            return Song.isNicovideoUrl(this.getSanitizedPermalink());
        }
        getNicovideoId() {
            var match = this.getSanitizedPermalink().match(/^(www\.)?nicovideo\.jp%2Fwatch%2F([a-z0-9]+)/i);
            return (match === null || match.length < 3) ? null : match[2];
        }
        isYouTube() {
            return Song.isYouTubeUrl(this.getSanitizedPermalink());
        }
        getYouTubeId() {
            var match = this.getSanitizedPermalink().match(/^((www|m)\.)?youtube\.com%2Fwatch%3Fv%3D([^\?&"'>]+)/i);
            return (match === null || match.length < 4) ? null : match[3];
        }
        isPiapro() {
            return Song.isPiaproUrl(this.getSanitizedPermalink());
        }
        getSongriumUrl() {
            return 'http://songrium.jp/map/#!/songs/' + this.getSanitizedPermalink();
        }
        getSongleUrl() {
            return 'http://songle.jp/songs/' + this.getSanitizedPermalink();
        }
        // static methods
        static isNicovideoUrl(url) {
            return /^(www\.)?nicovideo\.jp/i.test(stripProtocol(url));
        }
        static isYouTubeUrl(url) {
            return /^((www|m)\.)?youtube\.com/i.test(stripProtocol(url));
        }
        static isPiaproUrl(url) {
            return /^(www\.)?piapro\.jp/i.test(stripProtocol(url));
        }
    }
    exports.Song = Song;
    function createSanitizedPermalink(songlePath) {
        return encodeURIComponent(songlePath);
    }
    exports.createSanitizedPermalink = createSanitizedPermalink;
    function stripProtocol(url) {
        var stripper = /^(ht|f)tps?:\/\/(.+)$/.exec(url);
        if (stripper)
            url = stripper[2];
        return url;
    }
    exports.stripProtocol = stripProtocol;
    function get(url, resultHandler) {
        $.get("http://widget.songle.jp/api/v1/song.json", {
            url: stripProtocol(url)
        }, (data, textStatus, jqXHR) => {
            resultHandler(new Song(data));
        }, "json").fail(() => {
            resultHandler(null);
        });
    }
    exports.get = get;
    function search(keyword, resultsHandler) {
        $.get("http://widget.songle.jp/api/v1/songs/search.json", {
            q: keyword
        }, (data, textStatus, jqXHR) => {
            const results = [];
            $.each(data, (i, e) => results.push(new Song(e)));
            resultsHandler(results);
        }, "json").fail(() => {
            resultsHandler(null);
        });
    }
    exports.search = search;
});
/// <reference types="@types/jquery" />
/// <reference types="@types/semantic-ui" />
define("main", ["require", "exports", "SongleWidgetAPIClient"], function (require, exports, SWAPI) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const queries = parseQueryString();
    var Player;
    $('body').dimmer({
        onHide: () => $('#music-searcher input[name=music-search]').focus()
    });
    $('body').dimmer('show');
    setStartButtonEnabled(false);
    self['taAsyncInit'] = (p) => {
        if (!!queries.debug)
            console.log('TextAlive ready:', p);
        $('body').dimmer('hide');
        setStartButtonEnabled(true);
        Player = p;
        if (typeof queries.url === 'string') {
            const prefillUrl = decodeURIComponent(queries.url), $radio = $('#music-selector input[type=radio]').filter((i, e) => { return $(e).val() === prefillUrl; });
            if ($radio.length > 0) {
                $radio.parent().checkbox('check');
            }
            else {
                $('#music-searcher input[name=music-search]').val(prefillUrl);
                $('#music-searcher form').submit();
            }
        }
    };
    // 「再生する」ボタン
    $('#start button').on('click touch', (ev) => {
        ev.preventDefault();
        // メディアURLを取得
        var mediaUrl;
        const radioUrl = $('#music-selector input[name=music]:checked').val();
        if (typeof radioUrl === 'string') {
            mediaUrl = radioUrl;
        }
        else {
            const dropdownUrl = $('#music-searcher').next('.dropdown').dropdown('get value');
            if (typeof dropdownUrl === 'string')
                mediaUrl = dropdownUrl;
            else
                return;
        }
        // 動画を自動生成
        synthesizeVideo(mediaUrl);
        $('#output .lyrics.message').addClass('hidden').hide();
    });
    // 「楽曲を選ぶ」フォーム
    $('#music-selector .ui.radio.checkbox').checkbox({
        onChange: () => setStartButtonEnabled(true)
    });
    // 「楽曲を探す」フォーム
    $('#music-searcher form').on('submit', (ev) => {
        ev.preventDefault();
        $('#music-selector .ui.radio.checkbox').checkbox('uncheck');
        var keyword = $('#music-searcher input[name=music-search]').val();
        if (handleMediaUrl(keyword))
            return;
        SWAPI.search(keyword, handleSearchResults);
        return false;
    });
    function isURL(url) {
        return url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
    }
    function parseQueryString() {
        var queryString = location.search;
        var parameters = {};
        if (queryString.charAt(0) !== '?') {
            return {};
        }
        var q = queryString.substring(1).split('&');
        for (var i = 0; i < q.length; i++) {
            const e = q[i], key = e.substring(0, e.indexOf('=')), value = e.substring(key.length + 1);
            parameters[key] = value;
        }
        return parameters;
    }
    exports.parseQueryString = parseQueryString;
    // 引数がメディアURLならその情報をSongleから取得する
    // それ以外なら false を返す
    function handleMediaUrl(url) {
        if (!isURL(url))
            return false;
        var songPath = url.match(/(http:\/\/)?songle.jp\/songs\/(.+)/)
            || url.match(/(http:\/\/)?songrium.jp\/songs\/(.+)/);
        if (songPath)
            url = '//' + decodeURIComponent(songPath[2]);
        SWAPI.get(url, (song) => handleSearchResults(song ? [song] : null));
        return true;
    }
    // 検索結果を選択ボックスに表示
    function handleSearchResults(results) {
        if (!results || results.length <= 0) {
            return handleSearchNotFound();
        }
        $('#music-searcher').nextAll('.message').hide();
        // 選択ボックスを生成
        var dropdown = document.createElement('div');
        dropdown.className = 'ui fluid labeled icon selection dropdown';
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'music-url';
        var icon = document.createElement('i');
        icon.className = 'dropdown icon';
        dropdown.appendChild(icon);
        var defaultText = document.createElement('div');
        defaultText.className = 'default text';
        defaultText.appendChild(document.createTextNode('検索結果から音楽を選ぶ'));
        dropdown.appendChild(defaultText);
        var menu = document.createElement('div');
        menu.className = 'menu';
        // 選択ボックスに曲を追加
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var item = document.createElement('div');
            item.className = 'item';
            var label = document.createElement('div');
            label.className = 'ui horizontal label';
            var provider = 'MP3';
            if (result.isNicovideo())
                provider = 'ニコ動';
            else if (result.isPiapro())
                provider = 'ピアプロ';
            else if (result.isYouTube())
                provider = 'YouTube';
            label.appendChild(document.createTextNode(provider));
            var desc = document.createElement('span');
            desc.className = 'description';
            desc.appendChild(document.createTextNode(result.data.artist.name));
            var text = document.createElement('span');
            text.className = 'text';
            text.appendChild(document.createTextNode(result.data.title));
            $(item)
                .attr('data-value', result.data.permalink)
                .append(label, desc, text);
            menu.appendChild(item);
        }
        // 選択ボックスをDOMに追加してイベントリスナを設定
        dropdown.appendChild(menu);
        $('#music-searcher').next('.dropdown').remove();
        $('#music-searcher').after(dropdown);
        $(dropdown).dropdown({
            onChange: (value, text, $selectedItem) => {
                $('#music-selector .ui.radio.checkbox').checkbox('uncheck');
                setStartButtonEnabled(true);
            }
        });
        if (results.length === 1) {
            $(dropdown).dropdown('set selected', results[0].data.permalink);
        }
    }
    // 検索結果が見つからなかったときの処理
    function handleSearchNotFound() {
        $('#music-searcher').next('.dropdown').remove();
        $('#music-searcher').nextAll('.message').css('display', 'block');
        if (typeof $('#music-selector input[name=music]:checked').val() === 'undefined') {
            setStartButtonEnabled(false);
        }
    }
    // 「再生する」ボタンを有効化・無効化
    function setStartButtonEnabled(enabled) {
        var $button = $('#start button');
        $button.prop('disabled', !enabled);
    }
    // 動画を自動生成
    var player = null, url = '';
    function synthesizeVideo(mediaUrl) {
        if (!!queries.debug)
            console.log(`mediaUrl: ${mediaUrl}`);
        if (player) {
            try {
                player.dispose();
            }
            catch (e) { }
        }
        $('#player-root').empty();
        player = new Player({
            playerRoot: '#player-root',
            onReady: onVideoReady,
            onError: onVideoError
        });
        player.synthVideo(mediaUrl);
        url = mediaUrl;
    }
    function onVideoReady(player) {
        if (!!queries.debug)
            console.log('player:', player);
        player.setStyle('energetic');
    }
    function onVideoError(err) {
        if (!!queries.debug)
            console.log('error:', err);
        if (!err)
            return;
        if (err.lyrics) {
            const songPath = SWAPI.createSanitizedPermalink(SWAPI.stripProtocol(url));
            $('#output .lyrics.message a')
                .attr('href', `http://textalive.jp/songs/${songPath}`);
            $('#output .lyrics.message')
                .removeClass('hidden')
                .show();
        }
    }
});
