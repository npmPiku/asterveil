import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  prove_access(context: __compactRuntime.CircuitContext<PS>,
               member_secret_0: Uint8Array,
               member_clearance_0: bigint,
               badge_commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  update_gate(context: __compactRuntime.CircuitContext<PS>,
              admin_secret_0: Uint8Array,
              new_allowlist_root_0: Uint8Array,
              new_minimum_clearance_0: bigint,
              new_max_entries_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  set_gate_open(context: __compactRuntime.CircuitContext<PS>,
                admin_secret_0: Uint8Array,
                open_state_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  prove_access(context: __compactRuntime.CircuitContext<PS>,
               member_secret_0: Uint8Array,
               member_clearance_0: bigint,
               badge_commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  update_gate(context: __compactRuntime.CircuitContext<PS>,
              admin_secret_0: Uint8Array,
              new_allowlist_root_0: Uint8Array,
              new_minimum_clearance_0: bigint,
              new_max_entries_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  set_gate_open(context: __compactRuntime.CircuitContext<PS>,
                admin_secret_0: Uint8Array,
                open_state_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  derive_member_key(member_secret_0: Uint8Array): Uint8Array;
  derive_member_nullifier(member_secret_0: Uint8Array): Uint8Array;
  derive_admin_key(admin_secret_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  derive_member_key(context: __compactRuntime.CircuitContext<PS>,
                    member_secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  derive_member_nullifier(context: __compactRuntime.CircuitContext<PS>,
                          member_secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  derive_admin_key(context: __compactRuntime.CircuitContext<PS>,
                   admin_secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  prove_access(context: __compactRuntime.CircuitContext<PS>,
               member_secret_0: Uint8Array,
               member_clearance_0: bigint,
               badge_commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  update_gate(context: __compactRuntime.CircuitContext<PS>,
              admin_secret_0: Uint8Array,
              new_allowlist_root_0: Uint8Array,
              new_minimum_clearance_0: bigint,
              new_max_entries_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  set_gate_open(context: __compactRuntime.CircuitContext<PS>,
                admin_secret_0: Uint8Array,
                open_state_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly gate_name: Uint8Array;
  readonly allowlist_root: Uint8Array;
  readonly minimum_clearance: bigint;
  readonly max_entries: bigint;
  readonly verified_entries: bigint;
  nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  badge_registry: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly admin_public_key: Uint8Array;
  readonly is_open: boolean;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               initial_gate_name_0: Uint8Array,
               initial_allowlist_root_0: Uint8Array,
               initial_minimum_clearance_0: bigint,
               initial_max_entries_0: bigint,
               initial_admin_key_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
