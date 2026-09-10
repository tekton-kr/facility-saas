import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getConnectors } from '../lib/catalog.ts'
import { createSiteFromWizard } from '../lib/field.ts'
import { PRESET_LABEL } from '../lib/format.ts'
import { useScope } from '../lib/useScope.ts'
import type { SitePreset } from '../types/domain.ts'

const PRESETS = Object.keys(PRESET_LABEL) as SitePreset[]

export function SiteWizard() {
  const navigate = useNavigate()
  const { search } = useScope()
  const connectors = getConnectors()
  const [step, setStep] = useState(1)
  const [preset, setPreset] = useState<SitePreset>('office')
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [connectorIds, setConnectorIds] = useState<string[]>([connectors[0]?.id].filter(Boolean))

  function toggleConnector(id: string) {
    setConnectorIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ))
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (step < 3) {
      setStep(step + 1)
      return
    }
    const site = createSiteFromWizard({ name, location, preset, connectorIds })
    navigate(`/sites/${site.id}/contract${search}`)
  }

  return (
    <form className="wizard" onSubmit={onSubmit}>
      <ol className="work-steps">
        <li className={step === 1 ? 'is-current' : ''}>1 프리셋</li>
        <li className={step === 2 ? 'is-current' : ''}>2 커넥터</li>
        <li className={step === 3 ? 'is-current' : ''}>3 포인트</li>
      </ol>
      {step === 1 ? (
        <>
          <p className="kpi-note">병원 UI / 호텔 UI는 없습니다. 붙는 점만 다릅니다.</p>
          <div className="chip-row">
            {PRESETS.map((item) => (
              <button
                key={item}
                type="button"
                className={preset === item ? 'is-active' : ''}
                onClick={() => setPreset(item)}
              >
                {PRESET_LABEL[item]}
              </button>
            ))}
          </div>
          <label>
            현장 이름
            <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="성남 오피스" />
          </label>
          <label>
            위치
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="경기 성남시" />
          </label>
        </>
      ) : null}
      {step === 2 ? (
        <div className="list">
          {connectors.map((item) => (
            <label key={item.id} className="list-item wizard-check">
              <span>
                <strong>{item.name}</strong>
                <div className="kpi-meta">{item.protocol}</div>
              </span>
              <input
                type="checkbox"
                checked={connectorIds.includes(item.id)}
                onChange={() => toggleConnector(item.id)}
              />
            </label>
          ))}
        </div>
      ) : null}
      {step === 3 ? (
        <p className="kpi-note">
          프리셋 {PRESET_LABEL[preset]}로 수전·상태점 몇 개를 넣습니다. 화면 코드는 추가하지 않습니다.
        </p>
      ) : null}
      <div className="field-form">
        {step > 1 ? (
          <button className="sheet-back" type="button" onClick={() => setStep(step - 1)}>이전</button>
        ) : null}
        <button className="login-submit field-action" type="submit">
          {step < 3 ? '다음' : '현장 추가'}
        </button>
      </div>
    </form>
  )
}
