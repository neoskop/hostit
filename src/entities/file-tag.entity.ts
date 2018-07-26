import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { FileEntity } from './file.entity';

@Entity('file_tag')
export class FileTagEntity {
    @ManyToOne(() => FileEntity, { primary: true })
    file? : FileEntity;
    
    @PrimaryColumn()
    tag! : string;
}
