import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common'

@Injectable()
export class AllowEmptyPipe implements PipeTransform {
    private pipes: PipeTransform[] = []
    constructor(...pipes: PipeTransform[]) {
        this.pipes = pipes
    }

    transform(value: any, metadata: ArgumentMetadata) {
        if (value) {
            for (const pipe of this.pipes) {
                value = pipe.transform(value, metadata)
            }
        }
        return value
    }
}
