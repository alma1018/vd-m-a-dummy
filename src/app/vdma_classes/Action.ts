
 export class Action {
    actionType: string;
    /**
     * ID to distinguish between multiple actions with the same name on the same node.
     */
    actionId: string;

    actionDescription?: string;
  
    /**
     * Array of actionParameter-objects for the indicated action e. g. deviceId, loadId,
     * external Triggers.
     */
    actionParameters?: ActionParameter[];
    /**
     * Enum of actions as described in the first column of "Actions and Parameters"
     * Identifies the function of the action.
     */
  

    blockingType: BlockingType;
    

}

export class ActionParameter {
    /**
     * The key of the action parameter.
     */
    key: string;
    /**
     * The value of the action parameter
     */
    value: any[] | boolean | number | string;
}
export enum BlockingType {
    Hard = "HARD",
    None = "NONE",
    Soft = "SOFT",
}