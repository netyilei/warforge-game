export let TexasStrategyJson = {
  "version": "0.3.0",
  "scope": "tree",
  "id": "cac716df-a4a3-4765-9ed6-2957320b5857",
  "title": "texasStrategy",
  "description": "",
  "root": "2c6a3fa3-09f8-4a57-8d46-cdd45700f524",
  "properties": {},
  "nodes": {
    "2c6a3fa3-09f8-4a57-8d46-cdd45700f524": {
      "id": "2c6a3fa3-09f8-4a57-8d46-cdd45700f524",
      "name": "Priority",
      "title": "Priority",
      "description": "",
      "properties": {},
      "display": {
        "x": -600,
        "y": -288
      },
      "children": [
        "92cd0805-b450-415d-8f0c-305c16871b78",
        "58198448-2f35-49b3-b7e9-a1b6768f0d17",
        "58250592-adda-40d9-8676-4afba6a57c62",
        "3ce47de1-d77c-40bb-956f-6f3b7fa5886f",
        "3fe39975-6945-4203-89c5-f786644ae93f",
        "ea911167-763d-49af-8d50-39388ecf65a5"
      ]
    },
    "e9354e47-2867-4f3d-8aa9-2bb36c10e711": {
      "id": "e9354e47-2867-4f3d-8aa9-2bb36c10e711",
      "name": "B3IsReadyExit",
      "title": "B3IsReadyExit",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": -888
      }
    },
    "58198448-2f35-49b3-b7e9-a1b6768f0d17": {
      "id": "58198448-2f35-49b3-b7e9-a1b6768f0d17",
      "name": "Sequence",
      "title": "Sequence",
      "description": "",
      "properties": {},
      "display": {
        "x": -396,
        "y": -840
      },
      "children": [
        "e9354e47-2867-4f3d-8aa9-2bb36c10e711",
        "010e6894-63c7-4f8b-a999-be04ccbe4b2d"
      ]
    },
    "010e6894-63c7-4f8b-a999-be04ccbe4b2d": {
      "id": "010e6894-63c7-4f8b-a999-be04ccbe4b2d",
      "name": "B3ReadyExit",
      "title": "B3ReadyExit",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": -792
      }
    },
    "3fe39975-6945-4203-89c5-f786644ae93f": {
      "id": "3fe39975-6945-4203-89c5-f786644ae93f",
      "name": "Sequence",
      "title": "Sequence",
      "description": "",
      "properties": {},
      "display": {
        "x": -396,
        "y": 180
      },
      "children": [
        "bc634a19-6e11-4f33-ae3b-94fc7e8ab087",
        "169ac6b8-0dfe-4541-8d67-b2e9dd75e97e"
      ]
    },
    "717ac5d1-372a-4d56-96fa-ee43d4b81458": {
      "id": "717ac5d1-372a-4d56-96fa-ee43d4b81458",
      "name": "B3CheckBalance",
      "title": "B3CheckBalance",
      "description": "",
      "properties": {},
      "display": {
        "x": 444,
        "y": 168
      }
    },
    "60f32049-7ff8-4425-a4df-2afab6025dc5": {
      "id": "60f32049-7ff8-4425-a4df-2afab6025dc5",
      "name": "B3IsSendChat",
      "title": "B3IsSendChat",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": 528
      }
    },
    "ea911167-763d-49af-8d50-39388ecf65a5": {
      "id": "ea911167-763d-49af-8d50-39388ecf65a5",
      "name": "Sequence",
      "title": "Sequence",
      "description": "",
      "properties": {},
      "display": {
        "x": -396,
        "y": 528
      },
      "children": [
        "1a456411-07bb-4098-9051-c2c30e1bbea9",
        "60f32049-7ff8-4425-a4df-2afab6025dc5",
        "1e89708b-1fad-451f-9d32-4d419469ffb8"
      ]
    },
    "1e89708b-1fad-451f-9d32-4d419469ffb8": {
      "id": "1e89708b-1fad-451f-9d32-4d419469ffb8",
      "name": "B3SendRandChat",
      "title": "B3SendRandChat",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": 612
      }
    },
    "a54afbad-537e-449f-9fea-b6f4859d45fe": {
      "id": "a54afbad-537e-449f-9fea-b6f4859d45fe",
      "name": "B3CheckSitDown",
      "title": "B3CheckSitDown",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": -96
      }
    },
    "d9fc05fc-09ae-406a-8ee1-b4b720b1d0a0": {
      "id": "d9fc05fc-09ae-406a-8ee1-b4b720b1d0a0",
      "name": "B3ReadyStandup",
      "title": "B3ReadyStandup",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": -360
      }
    },
    "3ce47de1-d77c-40bb-956f-6f3b7fa5886f": {
      "id": "3ce47de1-d77c-40bb-956f-6f3b7fa5886f",
      "name": "Sequence",
      "title": "Sequence",
      "description": "",
      "properties": {},
      "display": {
        "x": -396,
        "y": -132
      },
      "children": [
        "fdb958b8-30f6-438d-8593-b281bdb8cc39",
        "a2af9ddd-4d63-4d21-8eef-e707954ffe35",
        "a54afbad-537e-449f-9fea-b6f4859d45fe",
        "2bd411f6-57ac-413a-84ec-a7efcf1dddb9"
      ]
    },
    "2bd411f6-57ac-413a-84ec-a7efcf1dddb9": {
      "id": "2bd411f6-57ac-413a-84ec-a7efcf1dddb9",
      "name": "B3SitDown",
      "title": "B3SitDown",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": 0
      }
    },
    "d6d75f87-edba-4414-8d36-d314d21d7bf5": {
      "id": "d6d75f87-edba-4414-8d36-d314d21d7bf5",
      "name": "B3CheckStandup",
      "title": "B3CheckStandup",
      "description": "",
      "properties": {},
      "display": {
        "x": 24,
        "y": -624
      }
    },
    "58250592-adda-40d9-8676-4afba6a57c62": {
      "id": "58250592-adda-40d9-8676-4afba6a57c62",
      "name": "Sequence",
      "title": "Sequence",
      "description": "",
      "properties": {},
      "display": {
        "x": -396,
        "y": -528
      },
      "children": [
        "d0c47d84-88d4-4687-9cc3-cf5eb225735c",
        "05c9782d-ea2d-4057-8358-f7e4931b0c2e",
        "d9fc05fc-09ae-406a-8ee1-b4b720b1d0a0"
      ]
    },
    "a8754324-b053-4226-8bfe-06d0ef0f5b42": {
      "id": "a8754324-b053-4226-8bfe-06d0ef0f5b42",
      "name": "B3ReadyStandup",
      "title": "B3ReadyStandup",
      "description": "",
      "properties": {},
      "display": {
        "x": 228,
        "y": 264
      }
    },
    "a2af9ddd-4d63-4d21-8eef-e707954ffe35": {
      "id": "a2af9ddd-4d63-4d21-8eef-e707954ffe35",
      "name": "B3CheckBalance",
      "title": "B3CheckBalance",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": -180
      }
    },
    "1d407db2-8d67-4793-be89-75d30ca644c6": {
      "id": "1d407db2-8d67-4793-be89-75d30ca644c6",
      "name": "Inverter",
      "title": "Inverter",
      "description": "",
      "properties": {},
      "display": {
        "x": 228,
        "y": 168
      },
      "child": "717ac5d1-372a-4d56-96fa-ee43d4b81458"
    },
    "1a456411-07bb-4098-9051-c2c30e1bbea9": {
      "id": "1a456411-07bb-4098-9051-c2c30e1bbea9",
      "name": "B3IsInDesk",
      "title": "B3IsInDesk",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": 432
      }
    },
    "d0c47d84-88d4-4687-9cc3-cf5eb225735c": {
      "id": "d0c47d84-88d4-4687-9cc3-cf5eb225735c",
      "name": "B3IsInDesk",
      "title": "B3IsInDesk",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": -708
      }
    },
    "bc634a19-6e11-4f33-ae3b-94fc7e8ab087": {
      "id": "bc634a19-6e11-4f33-ae3b-94fc7e8ab087",
      "name": "B3IsInDesk",
      "title": "B3IsInDesk",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": 84
      }
    },
    "04499d31-cf8b-440f-8ef1-2d874e27b209": {
      "id": "04499d31-cf8b-440f-8ef1-2d874e27b209",
      "name": "B3IsOutInterval",
      "title": "B3IsOutInterval",
      "description": "",
      "properties": {
        "delay": 1000
      },
      "display": {
        "x": -180,
        "y": -972
      }
    },
    "92cd0805-b450-415d-8f0c-305c16871b78": {
      "id": "92cd0805-b450-415d-8f0c-305c16871b78",
      "name": "Inverter",
      "title": "Inverter",
      "description": "",
      "properties": {},
      "display": {
        "x": -396,
        "y": -972
      },
      "child": "04499d31-cf8b-440f-8ef1-2d874e27b209"
    },
    "169ac6b8-0dfe-4541-8d67-b2e9dd75e97e": {
      "id": "169ac6b8-0dfe-4541-8d67-b2e9dd75e97e",
      "name": "Priority",
      "title": "Priority",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": 288
      },
      "children": [
        "663d9fd0-664a-490b-86be-657cce53ab9d"
      ]
    },
    "7af38925-6e8f-4501-8107-3e147ba8b539": {
      "id": "7af38925-6e8f-4501-8107-3e147ba8b539",
      "name": "Sequence",
      "title": "Sequence",
      "description": "",
      "properties": {},
      "display": {
        "x": 24,
        "y": 216
      },
      "children": [
        "1d407db2-8d67-4793-be89-75d30ca644c6",
        "a8754324-b053-4226-8bfe-06d0ef0f5b42"
      ]
    },
    "663d9fd0-664a-490b-86be-657cce53ab9d": {
      "id": "663d9fd0-664a-490b-86be-657cce53ab9d",
      "name": "B3Buyin",
      "title": "B3Buyin",
      "description": "",
      "properties": {},
      "display": {
        "x": 24,
        "y": 348
      }
    },
    "fdb958b8-30f6-438d-8593-b281bdb8cc39": {
      "id": "fdb958b8-30f6-438d-8593-b281bdb8cc39",
      "name": "Inverter",
      "title": "Inverter",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": -264
      },
      "child": "a2440aea-afa3-4b47-80cf-f3b9649dbf10"
    },
    "a2440aea-afa3-4b47-80cf-f3b9649dbf10": {
      "id": "a2440aea-afa3-4b47-80cf-f3b9649dbf10",
      "name": "B3IsInDesk",
      "title": "B3IsInDesk",
      "description": "",
      "properties": {},
      "display": {
        "x": 24,
        "y": -264
      }
    },
    "05c9782d-ea2d-4057-8358-f7e4931b0c2e": {
      "id": "05c9782d-ea2d-4057-8358-f7e4931b0c2e",
      "name": "Priority",
      "title": "Priority",
      "description": "",
      "properties": {},
      "display": {
        "x": -180,
        "y": -528
      },
      "children": [
        "d6d75f87-edba-4414-8d36-d314d21d7bf5",
        "a73ea02c-5875-435a-aa80-2cfe63d9f392",
        "37396f04-131d-4e9a-821a-a1149167281e"
      ]
    },
    "37396f04-131d-4e9a-821a-a1149167281e": {
      "id": "37396f04-131d-4e9a-821a-a1149167281e",
      "name": "B3IsNoPlayer",
      "title": "B3IsNoPlayer",
      "description": "",
      "properties": {},
      "display": {
        "x": 24,
        "y": -444
      }
    },
    "a73ea02c-5875-435a-aa80-2cfe63d9f392": {
      "id": "a73ea02c-5875-435a-aa80-2cfe63d9f392",
      "name": "B3IsFinishJuCount",
      "title": "B3IsFinishJuCount",
      "description": "",
      "properties": {},
      "display": {
        "x": 24,
        "y": -540
      }
    }
  },
  "display": {
    "camera_x": 720.9969428665197,
    "camera_y": 285.99751372293065,
    "camera_z": 0.75,
    "x": -804,
    "y": -288
  },
  "custom_nodes": [
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3Random",
      "category": "composite",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3WaitSeq",
      "category": "composite",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3GamePri",
      "category": "composite",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3ReadyExit",
      "category": "action",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3ReadyStandup",
      "category": "action",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3SitDown",
      "category": "action",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3Bet",
      "category": "action",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3Raise",
      "category": "action",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3Call",
      "category": "action",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3Allin",
      "category": "action",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3Abandon",
      "category": "action",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3CheckBalance",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsReadyExit",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3CheckSitDown",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsBet",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsRaise",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsCall",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsAllin",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsSendChat",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3SendRandChat",
      "category": "action",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsCheck",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3Check",
      "category": "action",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3CaleScore",
      "category": "decorator",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsEnoughScore",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsMaxWinRate",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3RandomSuccess",
      "category": "decorator",
      "title": null,
      "description": null,
      "properties": {
        "randomKey": ""
      }
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3CheckEV",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3CheckStandup",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsInDesk",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsOutInterval",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3Buyin",
      "category": "action",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3CheckPersonality",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {
        "action": "raise"
      }
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3CheckBluffAllin",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3CheckBluff",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsOtherAllIn",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsNoPlayer",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    },
    {
      "version": "0.3.0",
      "scope": "node",
      "name": "B3IsFinishJuCount",
      "category": "condition",
      "title": null,
      "description": null,
      "properties": {}
    }
  ]
}