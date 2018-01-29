/// <reference types="@types/jquery" />

export class Song {

  // raw data from Songle Widget v1 API
  data: {
    url: string;
    artist: { id: number; name: string };
    id: number;
    duration: number;
    permalink: string;
    code: string;
    rmsAmplitude: number;
    createdAt: string;
    updatedAt: string;
    recognizedAt: string;
    title: string;
  }

  public constructor(data: any) {
    this.data = data;
  }

  // public methods
  public getSonglePath(): string {
    return stripProtocol(this.data.permalink);
  }
  public getTextAliveUrl(): string {
    return 'http://textalive.jp/songs/' + Song.createSanitizedPermalink(this.getSonglePath());
  }
  public getSanitizedPermalink(): string {
    return Song.createSanitizedPermalink(this.getSonglePath());
  }
  public isNicovideo(): boolean {
    return Song.isNicovideoUrl(this.getSanitizedPermalink());
  }
  public getNicovideoId(): string | null {
    var match = this.getSanitizedPermalink().match(/^(www\.)?nicovideo\.jp%2Fwatch%2F([a-z0-9]+)/i);
    return (match === null || match.length < 3) ? null : match[2];
  }
  public isYouTube(): boolean {
    return Song.isYouTubeUrl(this.getSanitizedPermalink());
  }
  public getYouTubeId(): string | null {
    var match = this.getSanitizedPermalink().match(/^((www|m)\.)?youtube\.com%2Fwatch%3Fv%3D([^\?&"'>]+)/i);
    return (match === null || match.length < 4) ? null : match[3];
  }
  public isPiapro(): boolean {
    return Song.isPiaproUrl(this.getSanitizedPermalink());
  }
  public getSongriumUrl(): string {
    return 'http://songrium.jp/map/#!/songs/' + this.getSanitizedPermalink();
  }
  public getSongleUrl(): string {
    return 'http://songle.jp/songs/' + this.getSanitizedPermalink();
  }

  // static methods
  public static createSanitizedPermalink(songlePath: string): string {
    return encodeURIComponent(songlePath);
  }
  public static isNicovideoUrl(url: string): boolean {
    return /^(www\.)?nicovideo\.jp/i.test(stripProtocol(url));
  }
  public static isYouTubeUrl(url: string): boolean {
    return /^((www|m)\.)?youtube\.com/i.test(stripProtocol(url));
  }
  public static isPiaproUrl(url: string): boolean {
    return /^(www\.)?piapro\.jp/i.test(stripProtocol(url));
  }
}

export function stripProtocol(url: string) {
  var stripper = /^(ht|f)tps?:\/\/(.+)$/.exec(url);
  if (stripper) url = stripper[2];
  return url;
}

export function get(url: string
  , resultHandler: (result: Song | null) => void) {
  $.get("http://widget.songle.jp/api/v1/song.json", {
    url: stripProtocol(url)
  }, (data, textStatus, jqXHR) => {
    resultHandler(new Song(data));
  }, "json").fail(() => {
    resultHandler(null);
  });
}

export function search(
    keyword: string
  , resultsHandler: (results: Song[] | null) => void) {
  $.get("http://widget.songle.jp/api/v1/songs/search.json", {
    q: keyword
  }, (data, textStatus, jqXHR) => {
    const results: Song[] = [];
    $.each(data, (i, e) => results.push(new Song(e)));
    resultsHandler(results);
  }, "json").fail(() => {
    resultsHandler(null);
  });
}
