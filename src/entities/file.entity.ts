import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { JsonTransformer } from '@neoskop/nem-typeorm';
import { FileTagEntity } from './file-tag.entity';

@Entity('file')
export class FileEntity {
    @PrimaryGeneratedColumn('uuid')
    id? : string;
    
    @Column('text', { nullable: true, transformer: new JsonTransformer()})
    info?: any;
    
    @OneToMany(() => FileTagEntity, tag => tag.file, { onDelete: 'CASCADE', cascade: true, eager: true })
    tags? : FileTagEntity[];
    
    @Column('varchar', { length: 32 })
    type! : string;
    
    @Column()
    size! : number;
    
    @Column(process.env.SQLITE ? 'blob' : 'longblob')
    content! : Buffer;
}
