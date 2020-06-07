import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Switch, FlatList, PermissionsAndroid, ActivityIndicator, Modal, Alert, TextInput, ScrollView } from 'react-native'
import Feather from "react-native-feather1s"
import wifi from 'react-native-android-wifi'

import styles from './styles'

export default function App() {
  const [isEnable, setIsEnable] = useState(false)
  const [wifiList, setWifiList] = useState([])
  const [passWordModal, setPassWordModal] = useState(false)
  const [actualSSID, setActualSSID] = useState('')
  const [password, setPassword] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const [networkIP, setNetworkIP] = useState('')
  const [bssid, setBssid] = useState('')
  const [wifiStrenght, setWifiStrenght] = useState('')

  const [receiveCommand, setReceiveCommand] = useState('')
  const [sendCommand, setSendCommand] = useState('')

  async function verifyStatus() {
    const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
    if (!result) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
    }
    await wifi.isEnabled(status => setIsEnable(status))
    await wifi.connectionStatus((status) => setIsConnected(status))
    await wifi.getSSID(ssid => setActualSSID(ssid))
    await wifi.getIP(ip => setNetworkIP(ip))
    await wifi.getCurrentSignalStrength(level => setWifiStrenght(level))
    await wifi.getBSSID(chr => setBssid(chr))
  }

  async function toogleStatus() {
    try {
      if (isEnable) {
        wifi.setEnabled(false)
        setIsEnable(false)
      }
      else {
        wifi.setEnabled(true)
        setIsEnable(true)
      }
    }
    catch (err) {
      console.log(err)
    }
  }

  async function listWifi() {
    await wifi.loadWifiList(wifiStringList => {
      const wifiObjectList = JSON.parse(wifiStringList)
      console.log(wifiObjectList)
      setWifiList(wifiObjectList)
    },
      (error) => {
        console.log(error);
      }
    )
  }

  function getNetworkStatus(ssid, includesPassword) {
    setPassword('')
    setHasPassword(includesPassword)
    setActualSSID(ssid)
    setPassWordModal(true)
  }

  async function connect() {
    await wifi.findAndConnect(actualSSID, password, (found) => {
      if (found) console.log('conectado')
      else console.log('não conectado')
    })

    await wifi.getIP(ip => setNetworkIP(ip))
    await wifi.getCurrentSignalStrength(level => setWifiStrenght(level))
    await wifi.getBSSID(chr => setBssid(chr))
  }

  async function disconnect() {
    await wifi.disconnect()
    setIsConnected(false)
  }

  async function writeCommand() {
    const ws = new WebSocket('ws://192.168.4.1:80')

    ws.onopen = () => {
      ws.send(sendCommand)
      ws.close()
    }
  }

  async function readCommand() {
    const ws = new WebSocket('ws://192.168.4.1:80')

    ws.onmessage = msg => {
      console.log(msg.data)
      setReceiveCommand(msg.data)
      ws.close()
    }
  }

  useEffect(() => {
    verifyStatus()
  }, [])

  return (
    <View style={passWordModal ? styles.opacityContainer : styles.container}>

      <Modal
        visible={passWordModal}
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.networkName}>
            <Text style={{ fontSize: 28, textAlign: 'center', fontWeight: 'bold' }}>Rede</Text>
            <Text style={{ fontSize: 24, textAlign: 'center' }}>{actualSSID}</Text>
          </View>
          {hasPassword &&
            <TextInput
              style={styles.passwordInput}
              placeholder="Digite a senha aqui..."
              onChangeText={v => setPassword(v)}
            />}
          <TouchableOpacity
            onPress={connect}
            style={styles.action}
          >
            <Text style={styles.actionText}>Conectar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPassWordModal(false)}
            style={styles.actionOff}
          >
            <Text style={styles.actionOffText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.headerText}>Wifi</Text>
        <Switch onValueChange={toogleStatus} value={isEnable} />
      </View>

      {!isConnected ? (
        <View>
          <TouchableOpacity
            onPress={listWifi}
            disabled={!isEnable}
            style={isEnable ? styles.action : styles.actionDisabled}
          >
            <Text style={styles.actionText}>Buscar conexões</Text>
          </TouchableOpacity>

          {isEnable && (
            <View>
              <Text style={styles.title}>Conexões encontradas :</Text>
              <FlatList
                data={wifiList}
                keyExtractor={wifiNetwork => String(wifiNetwork.BSSID)}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: wifiNetwork }) => {
                  const includesPassword = wifiNetwork.capabilities.includes('[WPA')
                  return (
                    <TouchableOpacity
                      onPress={() => getNetworkStatus(wifiNetwork.SSID, includesPassword)}
                      style={styles.actionDevice}
                    >
                      <Feather name="wifi" size={22} color='#FFA707' />
                      <Text style={styles.deviceText}>{wifiNetwork.SSID}</Text>
                      {includesPassword && <Feather name="lock" size={22} color='#FFA707' />}
                    </TouchableOpacity>
                  )
                }}
              />
            </View>)}
        </View>
      ) : (
          <View>
            <TouchableOpacity
              onPress={disconnect}
              style={styles.action}
            >
              <Text style={styles.actionText}>Desconectar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Rede conectada :</Text>
            <TouchableOpacity
              onPress={disconnect}
              style={styles.actionDevice}
            >
              <Feather name="wifi" size={22} color='#FFA707' />
              <Text style={styles.deviceText}>{actualSSID}</Text>
              <Feather name="x-circle" size={22} color='#FFA707' />
            </TouchableOpacity>
            <View style={styles.detailContainer}>
              <Text><Text style={styles.featured}>IP da Rede : </Text> {networkIP}</Text>
              <Text><Text style={styles.featured}>BSSID : </Text> {bssid}</Text>
              <Text><Text style={styles.featured}>Sinal Wifi : </Text> {wifiStrenght}</Text>
            </View>

            <View style={styles.viewFooter}>

              <View style={styles.viewRow}>
                <View style={styles.txtBorded}>
                  <Text>Recebido: {receiveCommand}</Text>
                </View>
                <TouchableOpacity
                  onPress={readCommand}
                >
                  <Feather name="refresh-cw" size={30} color='#FFA707' />
                </TouchableOpacity>
              </View>
              <View style={styles.viewRow}>
                <TextInput
                  style={styles.txtInput}
                  placeholder='Digita o comando aqui...'
                  onChangeText={(val) => setSendCommand(val)}
                >
                </TextInput>
                <TouchableOpacity
                  onPress={writeCommand}
                >
                  <Feather name="send" size={30} color='#FFA707' />
                </TouchableOpacity>
              </View>

            </View>
          </View>
        )}
    </View>
  )
}