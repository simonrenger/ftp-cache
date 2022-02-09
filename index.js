const core = require('@actions/core');
const github = require('@actions/github');
const ftp = require("basic-ftp");
const tar = require("tar");
const path = require('path');
const fs = require('fs');
const SFTPClient = require('ssh2-sftp-client');

async function sftp_cache(host, user, password, secure, archive, archive_name, source, destination, timeout, upload) {
    const config = {
        host: host,
        username: user,
        password: password
    };

    const sftp = new SFTPClient('ftp-cache-action');
    sftp.on('upload', info => {
        core.info(`Listener: Uploaded ${info.source}`);
    });
    sftp.on('download', info => {
        core.info(`Listener: Download ${info.source}`);
    });
    sftp.on('upload', info => {
        core.info(`Listener: Uploaded ${info.source}`);
    });
    try {
        core.info(`Connecting`);
        await sftp.connect(config);

        if (archive) {
            let tar_name = `${archive_name}.tgz`;
            let dest = path.posix.join(destination, tar_name);
            let src = path.posix.join(source, tar_name);
            if (upload) {
                await tar.c(
                    {
                        gzip: true,
                        file: src
                    },
                    [source]
                );
                const found = await sftp.exists(destination);

                if (!found) {
                    core.info(`mkdir ${destination}`);
                    await sftp.mkdir(destination, false);
                }
                core.info(`upload ${src}`);
                await sftp.put(fs.createReadStream(src), dest, {
                    writeStreamOptions: {
                        flags: 'w',  // w - write and a - append
                        mode: 0o666, // mode to use for created file (rwx)
                    }
                });
                await sftp.end();
                fs.rmSync(src);
            } else {
                await sftp.get(src, fs.createWriteStream(dest));
                await sftp.end();
                await tar.x(
                    {
                        file: dest
                    }
                )
                fs.rmSync(dest);
            }
        } else {
            if (upload) {
                core.info(`upload: ${source} --> ${destination}`);
                await sftp.uploadDir(source, destination);
            } else {
                core.info(`upload: ${destination} <-- ${source}`);
                await sftp.downloadDir(source, destination);
            }
            sftp.end();
        }
    } catch (e) {
        core.warning(`error: ${e.message}`);
        sftp.end();
    }

}


async function ftp_cache(host, user, password, secure, archive, archive_name, source, destination, timeout, upload) {
    const client = new ftp.Client(timeout)
    client.ftp.verbose = true;
    try {

        client.trackProgress(info => {
            core.info(`File: ${info.name}`)
            core.info(`Type: ${info.type}`)
            core.info(`Transferred: ${info.bytes}`)
            core.info(`Transferred Overall: ${info.bytesOverall}`)
        })

        client.ftp.log = core.debug

        await client.access({
            host: host,
            user: user,
            password: password,
            secure: secure,
        })


        if (archive) {
            let tar_name = `${archive_name}.tgz`;
            let dest = path.posix.join(destination, tar_name);
            let src = path.posix.join(source, tar_name);
            if (upload) {
                await tar.c(
                    {
                        gzip: true,
                        file: tar_name
                    },
                    [source]
                );
                await client.uploadFrom(tar_name, dest);
                fs.rmSync(tar_name);
            } else {
                await client.downloadTo(dest, src);
                await tar.x(
                    {
                        file: dest
                    }
                )
                fs.rmSync(dest);
            }
        } else {
            if (upload) {
                await client.removeDir(destination);
                await client.uploadFromDir(source, destination);
            } else {
                await client.downloadToDir(destination, source);
            }
        }
    }
    catch (err) {
        console.log(err)
    }
    client.close()
}


(async () => {
    try {
        const host = core.getInput('host');
        const user = core.getInput('user');
        const password = core.getInput('password');
        const source = core.getInput('source');
        const destination = core.getInput('destination');
        const secure = core.getInput('secure') === "true";
        const timeout = parseInt(core.getInput('timeout'));
        const upload = core.getInput('upload') === "true";
        const archive = core.getInput('archive') === "true";
        const archive_name = core.getInput('archive-name');
        const mode = core.getInput('mode');
        if (mode == "FTP") {
            await ftp_cache(host, user, password, secure, archive, archive_name, source, destination, timeout, upload);
        } else {
            await sftp_cache(host, user, password, secure, archive, archive_name, source, destination, timeout, upload);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
})();