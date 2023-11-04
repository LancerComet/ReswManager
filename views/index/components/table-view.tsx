import { defineComponent } from 'vue'

import { useApp } from '../hooks/app'
import { GptResultSelector } from './gpt-result-selector'
import { useGptResultSelector } from '../hooks/gpt-result-selector'

import './table-view.styl'

const TableView = defineComponent({
  name: 'TableView',
  setup () {
    const {
      filenameRef, reswDataRef,
      langList, reswKeyList,
      getValue, updateText, submitSingleLangChanges,
      removeKey, reload, getGptTranslation
    } = useApp()
    const { isDisplayRef, translationRef, keyRef, openDialog, closeDialog } = useGptResultSelector()

    const onTextareaBlur = async (event: FocusEvent, lang: string, key: string) => {
      const target = event.target as HTMLTextAreaElement
      const newValue = target.value.trim()
      target.disabled = true
      await updateText(lang, key, newValue)
      target.disabled = false
    }

    const onAddRecordButtonClick = async () => {
      const key = window.prompt('Please provide a key:')
      if (!key) {
        return
      }

      for (const lang of Object.keys(reswDataRef.value)) {
        const langObj = reswDataRef.value[lang]
        langObj.elements?.[0]?.elements?.push({
          attributes: {
            name: key,
            'xml:space': 'preserve'
          },
          elements: [{
            type: 'element',
            name: 'value',
            elements: [
              { type: 'text', text: 'Put your text here' }
            ]
          }],
          name: 'data',
          type: 'element'
        })

        await submitSingleLangChanges(lang, filenameRef.value)
      }

      await reload()
    }

    const onRemoveButtonClick = async (event: Event, key: string) => {
      if (!window.confirm(`You are going to remove "${key}"`)) {
        return
      }
      const target = event.target as HTMLButtonElement
      target.disabled = true
      await removeKey(key)
      target.disabled = false
    }

    const onGptTranslationBtnClick = async (event: Event, key: string) => {
      const target = event.target as HTMLButtonElement
      target.disabled = true
      const gptTranslation = await getGptTranslation()
      target.disabled = false

      if (gptTranslation) {
        openDialog(gptTranslation, key)
      }
    }

    const onCopyKeyButtonClick = (key: string) => {
      const filename = filenameRef.value
      const fileKey = filename.trim().replace('.resw', '')
      const fullKey = `/${fileKey}/${key}`
      navigator.clipboard.writeText(fullKey)
        .then(() => {
          // ...
        })
        .catch(error => {
          console.error(error)
        })
    }

    const onGptTranslationSelect = async (payload: {
      lang: string
      text: string
      key: string
    }) => {
      await updateText(payload.lang, payload.key, payload.text)
    }

    const onGptTranslationTakeAll = async (payload: {
      translation: Record<string, string>
      key: string
    }) => {
      for (const lang of Object.keys(payload.translation)) {
        const text = payload.translation[lang]
        await updateText(lang, payload.key, text)
      }
    }

    const onKeyEditButtonClicked = async (key: string) => {
      const newKey = window.prompt('Please provide a new key:')
      if (!newKey) {
        return
      }

      for (const lang of Object.keys(reswDataRef.value)) {
        const langObj = reswDataRef.value[lang]
        const rootElement = langObj?.elements?.[0]
        const dataElement = rootElement?.elements
          ?.find(item => item.name === 'data' && item.attributes?.name === key)
        if (dataElement && dataElement.attributes) {
          dataElement.attributes.name = newKey
        }

        await submitSingleLangChanges(lang, filenameRef.value)
      }

      await reload()
    }

    const PlaceHolder = () => (
      <div class='table-view dp-flex align-center justify-center'>
        <div class='t-center'>
          <h1>F-word to Resw.</h1>
          <p>Please select a file first.</p>
        </div>
      </div>
    )

    const ActionBar = () => (
      <div class='action-bar'>
        <button class='add-button' onClick={onAddRecordButtonClick}>➕</button>
      </div>
    )

    const TableHeader = () => (
      <thead>
        <tr>
          <td></td>
          <td style='width: 10px'>Key</td>
          { Object.keys(reswDataRef.value).map(lang => <td>{lang}</td>) }
        </tr>
      </thead>
    )

    const TableBody = () => (
      <tbody>{
        reswKeyList.value.map(key => (
          <tr>
            <td style='width: 10px'>
              <div class='dp-flex align-center justify-center'>
                <button onClick={event => onRemoveButtonClick(event, key as string)}>❌</button>
                <button onClick={event => onGptTranslationBtnClick(event, key as string)}>💡 Ask GPT</button>
              </div>
            </td>
            <td>
              <div class='dp-flex flex-column align-center justify-center'>
                <span>{key}</span>
                <div class='t-center' style='margin-top: 5px'>
                  <button onClick={() => onKeyEditButtonClicked(key as string)}>Edit</button>
                  <button onClick={() => onCopyKeyButtonClick(key as string)}>📋 Copy Key</button>
                </div>
              </div>
            </td>
            {
              langList.value.map(lang => (
                <td>
                  <textarea
                    class='w-100'
                    style='margin-top: 10px'
                    value={getValue(lang, key as string)}
                    onBlur={event => onTextareaBlur(event, lang, key as string)}
                  />
                </td>
              ))
            }
          </tr>
        ))
      }</tbody>
    )

    return () => {
      if (!filenameRef.value) {
        return <PlaceHolder />
      }

      return (
        <div class='table-view over-auto'>
          <div>
            <h2>{filenameRef.value}</h2>
          </div>

          <ActionBar />

          <table class='data-table'>
            <TableHeader />
            <TableBody />
          </table>

          {
            isDisplayRef.value
              ? <GptResultSelector
                  translation={translationRef.value}
                  currentKey={keyRef.value}
                  onSelect={onGptTranslationSelect}
                  onClose={closeDialog}
                  onSelectAll={onGptTranslationTakeAll}
                />
              : undefined
          }
        </div>
      )
    }
  }
})

export {
  TableView
}
