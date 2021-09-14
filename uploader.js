'use strict';

/**
 * TODO : 
 *  - FTP 배포시 기존에 있던 디렉토리는 삭제하거나 백업하고, 새로운파일 업로드
 *  - WEB 버전으로 핸드링
 */

const fs = require('fs');
const cmd = require('node-run-cmd');
const ftpClient = require('ftp-client');
const inquirer = require('inquirer');
const moment = require('moment');
moment.locale('ko');

let localGitPath;
let ftpLog = [];

let __filenamespace = {
    setting: 'setting.json',
    hosts: 'host_dummy.json'
}

/**
 * FTP 연결체
 * @param {string} host 계정주소
 * @param {number} port 포트
 * @param {string} user 사용자
 * @param {string} password 비밀번호
 */
function getFtpConnection(host, port, user, password) {

    let conn = new ftpClient({
        host: host,
        port: port,
        user: user,
        password: password
    }, {
        logging: 'basic'
    });

    return conn;

}

/**
 * 셋팅파일 생성
 */
function createSettingFile() {

    return new Promise(function (resolve, reject) {

        fs.exists(__filenamespace.setting, function (exists) {

            if (exists) {

                fs.readFile(__filenamespace.setting, 'utf-8', function (err, data) {

                    if (err) reject(err);

                    localGitPath = JSON.parse(data)[0]['localGitPath'];
                    if (localGitPath[localGitPath.length - 1].match(/\//)) localGitPath = localGitPath.substring(0, localGitPath.length - 1)

                    resolve(localGitPath);

                });

            } else {

                let inputPrompt = [{
                    type: 'input',
                    name: 'localGitPath',
                    message: "ftp에 업로드 할 위치를 입력해 주세요.\n:",
                }]

                inquirer
                    .prompt(inputPrompt)
                    .then(answers => {

                        localGitPath = answers["localGitPath"].replace(/\\/g, '/');

                        fs.writeFile(__filenamespace.setting, `[{"localGitPath":"${localGitPath}"}]`, function (err) {

                            if (err) reject(err);

                            console.info(`## ${__filenamespace.setting} 파일이 생성되었습니다`.bold.red);
                            resolve(localGitPath);

                        });

                    });
            }

        });

    });

}

/**
 * 로그작성
 */
function writeLog() {

    return new Promise(function(resolve, reject) {

        fs.writeFile(`log/uploaded_${moment().format('MMMM-Do-YYYY-h.mm.ss')}.log`, ftpLog.join('\r\n'), 'utf8', (err) => {
            
            if (err) reject(err);
            
            console.info(`## 진행 로그파일이 생성되었습니다: log/uploaded_${moment().format('MMMM-Do-YYYY-h.mm.ss')}.log`.bold.red);
            resolve(`log/uploaded_${moment().format('MMMM-Do-YYYY-h.mm.ss')}.log`);
            
        });
        
    });
    
}

/**
 * 배포 하기
 * @param {*} obj 
 */
function deployChain( prevPromise, info ) {

    return prevPromise.then(() => {
        
        return new Promise(function(resolve, reject) {

            let userName = info['user'],
                passWord = info['password'],
                port = info['port'],
                host = info['host'],
                hostName = info['name'],
                localFilePath = `${localGitPath}/${info['local']}`,
                remoteFilePath = `${info['remote']}`,
                conn = getFtpConnection(host, port, userName, passWord);

            conn.connect(function () {

                console.info(`## ${host} (${hostName}) 배포를 시작합니다.`.bold.green);
                conn.upload([`${localFilePath}/**`], `${remoteFilePath}`, {
                    baseDir: `${localFilePath}`,
                    overwrite: 'all'
                }, function (result) {

                    let uploadedFiles = result['uploadedFiles'].join('\r\n');
                    resolve(
`========================================\r\n
host: ${host} (${hostName})\r\n
local: ${localFilePath}\r\n
remote: ${remoteFilePath}\r\n
uploadedFiles:\r\n${uploadedFiles}\r\n
errors:\r\n${result['errors']}`
                    )

                });

            });

        }).then(function(res) {
            ftpLog.push(res);
        })
    });

}

/**
 * FTP 배포
 */
function ftpDeploy() {

    let hosts;

    console.info(`## 배포 시나리오를 작성하고 있습니다`.bgBlue.white);
    return new Promise(function(resolve, reject) {

        fs.readFile(__filenamespace.hosts, 'utf-8', function (err, data) {

            if (err) reject(err);

            let ftpChain;

            hosts = JSON.parse(data);
            inquirer
                .prompt([{
                    type: 'confirm',
                    message: `
#################################################################
## Warning:
## 시나리오가 작성되었습니다. 실서버 배포 하시겠습니까?
#################################################################
`.cyan,
                    name: 'choice'
                }])
                .then(answer => {

                    if(answer['choice'] == true) {

                        hosts
                            .reduce( deployChain, Promise.resolve() )
                            .then(res => resolve('complete'));

                    } else {
                        reject('실서버 배포가 중지되었습니다.');
                    }

                });                
        });

    });

}

/**
 * 초기 세팅파일 생성 후 업로드
 */
function init() {

    console.clear();
    createSettingFile()
        .then( ftpDeploy )
        .then( writeLog )
        .catch(function (err) {
            console.error(err.toString().dim.bgYellow.red + '\n## 종료합니다');
        })

}

init();