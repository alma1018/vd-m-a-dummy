import { Component, Inject, OnInit } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { HammerModule } from '@angular/platform-browser';
import {Action} from "../vdma_classes/Action";
import {ActionParameter} from "../vdma_classes/Action";
import { BlockingType } from '../vdma_classes/Action';

let UP_Action = new ActionParameter;
UP_Action.key === "direction";
UP_Action.value === "up";

let DOWN_Action = new ActionParameter;
UP_Action.key === "direction";
UP_Action.value === "down";

let DOOR_Action = new ActionParameter;
UP_Action.key === "unlockClient";
UP_Action.value === "door_1";


@Component({
  selector: 'app-action-form',
  templateUrl: './action-form.component.html',
  styleUrls: ['./action-form.component.css']
})

export class ActionFormComponent implements OnInit {
  static globalActionList: Action[] = [
    {actionId: "blink0", actionType: "blink", actionDescription: "Grün blinken"},
    {actionId: "lift1", actionType: "lift", actionDescription: "Hub heben", actionParameters: [UP_Action]
    },
    {actionId: "lift2", actionType: "lift", actionDescription: "Hub senken", actionParameters: [DOWN_Action]
    },
    {actionId: "wait3", actionType: "wait", actionDescription: "Auf Türfreigabe warten", actionParameters: [DOOR_Action],
     blockingType: BlockingType.Hard
    },
    {actionId: "pick4", actionType: "pick", actionDescription: "KLT aufnehmen", blockingType: BlockingType.Hard},
    {actionId: "drop5", actionType: "drop", actionDescription: "KLT abliefern", blockingType: BlockingType.Hard}];
  globalActionListMirror: Action[] = [];
  blockingTypes = BlockingType;
  //triggerPointTypes = Action.triggerPointTypes;
  //durationTypes = Action.durationTypes;


  constructor(public dialogRef: MatDialogRef<ActionFormComponent>,
              @Inject(MAT_DIALOG_DATA) public action: Action) {

  }

  ngOnInit() {
    this.globalActionListMirror = this.getGlobalActionList();
    //console.log(this.triggerPointTypes);
  }

  addActionToGlobalActionList(action: Action) {
    if (ActionFormComponent.globalActionList.some(actionInList =>  {
      return actionInList.actionId === action.actionId;
    })) return;
    let actionCopy = Object.assign({}, action);
    ActionFormComponent.globalActionList.push(actionCopy);
  }

  getGlobalActionList() {
    return ActionFormComponent.globalActionList;
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    this.addActionToGlobalActionList(this.action);
    this.dialogRef.close(this.action);
  }

  newSelection(selectedAction: Action) {
    Object.assign(this.action, selectedAction);
  }

}
