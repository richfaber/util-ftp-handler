# FTP Uploader 

## 개요

FTP 다중서버 배포시에 {host.json} 파일을 통해 한번에 배포하도록 도와주는 도구

## 설치

- NODE 8.X 이상버전 설치 - [Node 웹사이트](https://nodejs.org/ko/)
- `npm install` - 의존성 파일 설치

## 사용법

- `npm run start`

```command
> npm install
...

> npm run start

> ftp-uploader@1.0.0 start D:\repositoryGit\uidev-tool\ftp-skinuploader
> node uploader

? {solup} clone 받은 위치를 입력해 주세요.
: 자신의 컴퓨터의 clone 받은 git 경로입력 (ex: D:\repositoryGit\solup)
```

해당경로를 입력하면 `setting.json` 파일이 생성된다.

## 안내

- 파일 업로드의 대상이 되는 내컴퓨터의 경로는 `setting.json` 파일에서 수정할 수 있다.
- `host.json` 파일에 매핑경로가 있다.

```json
{
    "name":"계정이름",
    "host":"호스트",
    "port":"포트",
    "user":"사용자ID",
    "password":"비밀번호",
    "local":"내컴퓨터 위치",
    "remote":"원격파일 위치"
}
```

- 윈도우만 대응합니다.
