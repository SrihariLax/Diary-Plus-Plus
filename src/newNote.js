let fs = require('fs');
let prefs = require('./Prefs.json');
let dialog = require('electron').remote.dialog;
let diaryName = window.localStorage.getItem('diaryName');
let { diaryStoreLocation, seperator } = require('./Globals');
let date = new Date();
let filePath = diaryStoreLocation + seperator + diaryName + seperator + date.toDateString().replace(/ /g, "-");

let infoPanel = document.getElementById('info');
let editor = document.getElementById('editor');
let editorTitle = document.getElementById('editorTitle');
let btnBack = document.getElementById('btnBack');
let btnSave = document.getElementById('btnSave');
let btnEdit = document.getElementById('btnEdit');
let btnDelete = document.getElementById('btnDelete');
let btnLoadFile = document.getElementById('btnLoadFile');

const crypto = require('crypto');
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

encrypt = (text) => {
 let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
 let encrypted = cipher.update(text);
 encrypted = Buffer.concat([encrypted, cipher.final()]);
 return {
     info: "Do not modify this file.",
     isEncrypted: true,
     title: editorTitle.value,
     key: key.toString('hex'),
     iv: iv.toString('hex'),
     encryptedData: encrypted.toString('hex')
    };
}

nonEncrypt = (text) => {
    return {
        isEncrypted: false,
        title: editorTitle.value,
        data: text
    }
}

decrypt = (text) => {
 let iv = Buffer.from(text.iv, 'hex');
 let encryptedText = Buffer.from(text.encryptedData, 'hex');
 let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(text.key, 'hex'), iv);
 let decrypted = decipher.update(encryptedText);
 decrypted = Buffer.concat([decrypted, decipher.final()]);
 return decrypted.toString();
}

btnBack.addEventListener('click', () => {
    window.location.href = "./index.html";
    window.localStorage.removeItem('readonly');
    window.localStorage.removeItem('entryPath');
});

btnSave.addEventListener('click', () => {
    infoPanel.style.display = "block";
    infoPanel.innerHTML = "Saving...";
    let data;
    if( prefs.encryption === true )
        data = JSON.stringify(encrypt(editor.value));
    else 
        data = JSON.stringify(nonEncrypt(editor.value));
    fs.writeFile(filePath, data, (err) => {
        if (err) console.log('Error in saving file\n'+err);
        infoPanel.innerHTML = "Saved Successfully!";
        setTimeout(() => {
            window.location.href = "./home.html";
        }, 800);
    });
});

btnEdit.addEventListener('click', () => {
    editor.readOnly = false;
    editorTitle.readOnly = false;
    btnSave.style.display = "block";
    btnLoadFile.style.display = "block";
    btnEdit.style.display = "none";
    infoPanel.innerHTML = "Edit Mode";
});

btnDelete.addEventListener('click', () => {
    let deletePrompt = document.createElement('div');
    let btnYes = document.createElement('input');
    let btnNo = document.createElement('input');
    btnYes.className = "button";
    btnNo.className = "button";
    btnYes.type = "button";
    btnNo.type = "button";
    btnYes.value = "Yes";
    btnNo.value = "No";
    deletePrompt.innerHTML = "Do you want to delete this entry? : ";
    deletePrompt.appendChild(btnYes);
    deletePrompt.appendChild(btnNo);
    btnYes.addEventListener('click', () => {
        fs.unlink(filePath, (err) => {
            console.log(err);
            infoPanel.innerHTML = "File deleted successfully";
            setTimeout(() => {
                window.location.href = "./home.html";
            }, 800);
        });
    });
    btnNo.addEventListener('click', () => {
        if(editor.readOnly === true)
            infoPanel.innerHTML = "Read-Only Mode";
        else 
            infoPanel.innerHTML = "Edit Mode";
    })
    infoPanel.innerHTML = "";
    infoPanel.appendChild(deletePrompt);
});

btnLoadFile.addEventListener('click', () => {
    dialog.showOpenDialog({ filters: [{ name: 'text', extensions: ['txt'] } ]}, (file) => {
        if(file === undefined) return;
        let fileName = file[0];
        fs.readFile(fileName, { encoding: 'utf-8' }, (err, data) => {
            if(err) console.log(err);
            editor.value += "\n\n" + data;
        })
    });
});

if(window.localStorage.getItem('readonly') === 'true') {
    filePath = window.localStorage.getItem('entryPath');
    fs.readFile(window.localStorage.getItem('entryPath'), {encoding: 'utf-8'}, (err, data) => {
        if(err) console.log(err);
        let fileData = JSON.parse(data);
        if (fileData.isEncrypted === true)
            editor.value = decrypt(fileData);
        else
            editor.value = fileData.data;
        editorTitle.value = fileData.title;
        editor.readOnly = true;
        editorTitle.readOnly = true;
        infoPanel.innerHTML = "Read-Only Mode"
        btnEdit.style.display = "block";
        btnDelete.style.display = "block";
        btnSave.style.display = "none";
    })
}