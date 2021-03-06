import { TypeFlags, Type, IType } from "../type"
import { IContext, IValidationResult, typeCheckSuccess, typeCheckFailure, typecheck } from "../type-checker"
import { fail } from "../../utils"
import { Node, createNode, isStateTreeNode } from "../../core"
import { string as stringType, number as numberType } from "../primitives"
import { Late } from "./late"

class Identifier {
    constructor(public identifier: string | number) {}
    toString() {
        return `identifier(${this.identifier})`
    }
}

export class IdentifierType<T> extends Type<T, T> {
    readonly flags = TypeFlags.Identifier

    constructor(public readonly identifierType: IType<T, T>) {
        super(`identifier(${identifierType.name})`)
    }

    instantiate(parent: Node | null, subpath: string, environment: any, snapshot: T): Node {
        if (!parent || !isStateTreeNode(parent.storedValue))
            return fail(`Identifier types can only be instantiated as direct child of a model type`)

        if (parent.identifierAttribute)
            fail(
                `Cannot define property '${subpath}' as object identifier, property '${parent.identifierAttribute}' is already defined as identifier property`
            )
        parent.identifierAttribute = subpath
        return createNode(this, parent, subpath, environment, snapshot)
    }

    reconcile(current: Node, newValue: any) {
        if (current.storedValue !== newValue)
            return fail(
                `Tried to change identifier from '${current.storedValue}' to '${newValue}'. Changing identifiers is not allowed.`
            )
        return current
    }

    describe() {
        return `identifier(${this.identifierType.describe()})`
    }

    isValidSnapshot(value: any, context: IContext): IValidationResult {
        return this.identifierType.validate(value, context)
    }
}

export function identifier<T>(baseType: IType<T, T>): IType<T, T>
export function identifier<T>(): T
export function identifier(baseType: IType<any, any> = stringType): any {
    // TODO: MWE: this seems contrived, let's not assert anything and support unions, refinements etc.
    if (baseType !== stringType && baseType !== numberType)
        fail(`Only 'types.number' and 'types.string' are acceptable as type specification for identifiers`)
    return new IdentifierType(baseType)
}

export function isIdentifierType(type: any): type is IdentifierType<any> {
    return (
        !(type instanceof Late) && (type.flags & TypeFlags.Identifier) > 0 // yikes
    )
}
