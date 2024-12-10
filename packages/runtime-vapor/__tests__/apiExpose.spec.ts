import { ref, shallowRef } from '@vue/reactivity'
import { type VaporComponentInstance, createComponent } from '../src/component'
import { setRef } from '../src/dom/templateRef'
import { makeRender } from './_utils'
import { currentInstance } from '@vue/runtime-dom'
import { defineVaporComponent } from '../src/apiDefineComponent'

const define = makeRender()

describe('api: expose', () => {
  test.todo('via setup context + template ref', () => {
    const Child = defineVaporComponent({
      setup(_, { expose }) {
        expose({
          foo: 1,
          bar: ref(2),
        })
        return []
      },
    })
    const childRef = ref()
    define({
      render: () => {
        const n0 = createComponent(Child)
        return n0
      },
    }).render()

    expect(childRef.value).toBeTruthy()
    expect(childRef.value.foo).toBe(1)
    expect(childRef.value.bar).toBe(2)
    expect(childRef.value.baz).toBeUndefined()
  })

  test.todo('via setup context + template ref (expose empty)', () => {
    let childInstance: VaporComponentInstance | null = null
    const Child = defineVaporComponent({
      setup(_) {
        childInstance = currentInstance as VaporComponentInstance
        return []
      },
    })
    const childRef = shallowRef()
    define({
      render: () => {
        const n0 = createComponent(Child)
        setRef(n0, childRef)
        return n0
      },
    }).render()

    expect(childInstance!.exposed).toBeUndefined()
    expect(childRef.value).toBe(childInstance!)
  })

  test('with mount', () => {
    const { instance } = define({
      setup(_, { expose }) {
        expose({
          foo: 1,
        })
        return []
      },
    }).render()
    expect(instance!.foo).toBe(1)
    expect(instance!.bar).toBe(undefined)
  })

  test('warning for ref', () => {
    define({
      setup(_, { expose }) {
        expose(ref(1))
        return []
      },
    }).render()

    expect(
      'expose() should be passed a plain object, received ref',
    ).toHaveBeenWarned()
  })

  test('warning for array', () => {
    define({
      setup(_, { expose }) {
        expose(['focus'])
        return []
      },
    }).render()

    expect(
      'expose() should be passed a plain object, received array',
    ).toHaveBeenWarned()
  })

  test('warning for function', () => {
    define({
      setup(_, { expose }) {
        expose(() => null)
        return []
      },
    }).render()

    expect(
      'expose() should be passed a plain object, received function',
    ).toHaveBeenWarned()
  })
})