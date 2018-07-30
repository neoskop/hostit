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
    
    @Column(/* istanbul ignore next */ process.env.SQLITE ? 'blob' : 'longblob')
    content! : Buffer;
    
    @Column('varchar', { nullable: true, length: 128 })
    creator?: string;
    
    @Column('varchar', { nullable: true, length: 128 })
    editor?: string;
    
    @Column({ type: /* istanbul ignore next */ process.env.SQLITE ? 'varchar' : 'timestamp', nullable: true, default: /* istanbul ignore next */ process.env.LEGACY_MYSQL ? '0000-00-00 00:00:00' : () => 'CURRENT_TIMESTAMP' })
    created? : string|null;
    
    @Column({ type: /* istanbul ignore next */ process.env.SQLITE ? 'varchar' : 'timestamp', nullable: true })
    updated? : string|null;
    
    @Column('int', { default: 0 })
    updates?: number;
    
    @Column('int', { default: 0 })
    views?: number;
}
