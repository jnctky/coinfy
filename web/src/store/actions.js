import React from 'react'
import { collect } from 'dop'
import routes from '/const/routes'
import styles from '/const/styles'
import { state, getTotalWallets } from '/store/state'
import { encryptAES128CTR } from '/api/security'

export function setHref(href) {
    state.location.href = href
}

export function createWallet(symbol, address) {
    state.wallets[symbol][address] = {
        label: '',
        balance: 0,
        last_update: 0 // last time we checked balance in timestamp
    }
    updateSession()
}
export function setPublicKey(symbol, address, public_key) {
    state.wallets[symbol][address].public_key = public_key
    updateSession()
}
export function setPrivateKey(symbol, address, private_key, password) {
    state.wallets[symbol][address].private_key = encryptAES128CTR(
        private_key,
        password
    )
    updateSession()
}
export function deleteWallet(symbol, address) {
    const collector = collect()
    delete state.wallets[symbol][address]
    setHref(routes.home())
    collector.emit()
    updateSession()
}


export function updateSession() {
    const wallets = JSON.stringify(state.wallets)
    window.localStorage.setItem('wallets', wallets)
}


export function exportWallets() {
    const wallets = JSON.stringify(state.wallets)
    const a = document.createElement('a')
    const file = new Blob([wallets], {type: 'application/json;charset=UTF-8'})
    const date = new Date().toJSON().replace(/\..+$/,'')
    a.href = URL.createObjectURL(file)
    a.download = `WEDONTNEEDBANKS_backup--${date}.json`
    a.click()
}


export function importWalletsFromFile() {
    const input = document.createElement('input')
    input.type = 'file'
    input.addEventListener('change', e=>{
        const file = input.files[0]
        if ( file.type.indexOf('json') > -1 || file.type.indexOf('text') > -1 || file.type==='' ) {
            const reader = new FileReader()
            reader.onload = e => {
                const dataString = e.target.result
                importWallets(dataString)
            }
            reader.readAsText(file)
        }
        else
            addNotification(<strong>Invalid JSON file</strong>, styles.notificationColor.red)
    })
    input.click()
}


export function importWallets(dataString) {
    try {
        const wallets = JSON.parse(dataString)
        const totalWallets = getTotalWallets(wallets)
        if (totalWallets > 0) {
            const collector = collect()
            state.wallets = wallets
            setHref(routes.home())
            addNotification(<strong>You have imported {totalWallets} Wallets</strong>, styles.notificationColor.green)
            updateSession()
            collector.emit()
        }
        else
            addNotification(<strong>We couldn't find any Wallet to Import on this JSON file</strong>, styles.notificationColor.red)
        
    } catch(e) { 
        console.log( e );
        addNotification(<strong>We couldn't parse the JSON file</strong>, styles.notificationColor.red)
    }
}

export function closeSession() {
    window.localStorage.removeItem('wallets')
    window.location.href = '/'
}

let idNotification = 1
export function addNotification(text, color, timeout=7500) {
    state.notifications[idNotification] = {
        id: idNotification,
        text: text,
        color: color,
        timeout: timeout
    }
    idNotification += 1
    return idNotification
}

export function removeNotification(id) {
    delete state.notifications[id]
}